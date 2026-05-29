// backend/routes/verification.js
const express   = require('express');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const { v4: uuidv4 } = require('uuid');
const Anthropic = require('@anthropic-ai/sdk');
const config    = require('../config');
const store     = require('../store');
const { requireAuth } = require('../middleware/auth');
const router    = express.Router();
const ai        = new Anthropic({ apiKey: config.anthropic.apiKey });

const PHRASES = [
  'My name is on Trppl and I am who I say I am.',
  'I verify that this is me and I am joining Trppl today.',
  'I confirm my identity on Trppl. This is my real face.',
  'I am a real person joining Trppl and this is my live face.',
  'I am joining Trppl as myself and I am over eighteen years old.',
];

const uploadDir = path.resolve(config.uploads.dir,'verification');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir,{recursive:true});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Detect extension from MIME type — Safari sends mp4/quicktime
    let ext = '.webm';
    if (file.mimetype === 'video/mp4' || file.mimetype === 'video/quicktime') ext = '.mp4';
    else if (file.mimetype === 'video/webm') ext = '.webm';
    else if (file.originalname) ext = path.extname(file.originalname) || '.mp4';
    cb(null, `${req.user.id}-video-${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: config.uploads.maxSize },
  fileFilter: (_req, file, cb) => {
    // Accept any video MIME type, or octet-stream (Safari sometimes sends this)
    const isVideo = file.mimetype.startsWith('video/') ||
                    file.mimetype === 'application/octet-stream';
    if (isVideo) return cb(null, true);
    cb(new Error('Only video files accepted. Got: ' + file.mimetype), false);
  },
});

function toBase64(p){return fs.readFileSync(p).toString('base64');}

async function extractFrame(videoPath,outputPath){
  return new Promise(resolve=>{
    const{execFile}=require('child_process');
    execFile('ffmpeg',['-i',videoPath,'-vframes','1','-q:v','2','-ss','00:00:01',outputPath,'-y'],(err)=>resolve(!err));
  });
}

async function runFaceMatch({profilePhotoPaths,videoFramePath}){
  const profilePath=profilePhotoPaths&&profilePhotoPaths[0];
  if(!profilePath||!fs.existsSync(profilePath)) return {score:0,detail:'No profile photo.',decision:'manual_review',passed:false};
  const profileExt=path.extname(profilePath).toLowerCase();
  const profileMime=profileExt==='.png'?'image/png':profileExt==='.webp'?'image/webp':'image/jpeg';
  const content=[
    {type:'image',source:{type:'base64',media_type:profileMime,data:toBase64(profilePath)}},
    {type:'text',text:'This is the user\'s profile photo (Image 1).'},
  ];
  if(videoFramePath&&fs.existsSync(videoFramePath)){
    content.push({type:'image',source:{type:'base64',media_type:'image/jpeg',data:toBase64(videoFramePath)}});
    content.push({type:'text',text:'This is a frame from the user\'s liveness video (Image 2).'});
  } else {
    content.push({type:'text',text:'No video frame available. Flag for manual review.'});
  }
  content.push({type:'text',text:`You are a facial verification AI for Trppl. Compare the profile photo with the video frame. Respond ONLY with valid JSON:\n{"same_person":bool,"confidence":0-100,"decision":"approve"|"reject"|"manual_review","reason":"one sentence"}\n\nApprove if same_person=true and confidence>=70. Reject if clearly different faces with confidence>=80. Otherwise manual_review.`});
  try{
    const r=await ai.messages.create({model:config.anthropic.model,max_tokens:256,messages:[{role:'user',content}]});
    const raw=r.content.map(b=>b.text||'').join('');
    const result=JSON.parse(raw.replace(/```json|```/g,'').trim());
    return {score:result.confidence||0,detail:JSON.stringify(result),decision:result.decision||'manual_review',passed:result.decision==='approve'};
  } catch(err){
    console.error('[Verification] AI error:',err.message);
    return {score:0,detail:'AI error: '+err.message,decision:'manual_review',passed:false};
  }
}

router.get('/phrase', requireAuth, (_req,res)=>res.json({phrase:PHRASES[Math.floor(Math.random()*PHRASES.length)]}));
router.get('/status', requireAuth, (req,res)=>{
  const{verificationStatus,profileVerified,verifiedAt,faceMatchScore}=req.user;
  res.json({verificationStatus,profileVerified,verifiedAt,faceMatchScore});
});

router.post('/submit', requireAuth,
  (req,res,next)=>{
    if(req.user.profileVerified) return res.status(409).json({error:'Already verified.'});
    if(req.user.verificationStatus==='processing') return res.status(409).json({error:'Verification is already processing.'});
    next();
  },
  upload.single('video'),
  async(req,res,next)=>{
    try{
      const video = req.file;
      if (!video) return res.status(400).json({ error: 'Verification video is required.' });
      console.log(`[Verification] Received video: ${video.originalname} type=${video.mimetype} size=${video.size}`);
      await store.updateUser(req.user.id,{videoPath:video.path,verificationStatus:'processing'});
      res.json({message:'Video received. Running face verification…',status:'processing'});

      setImmediate(async()=>{
        try{
          const framePath=video.path.replace(/\.[^.]+$/,'-frame.jpg');
          const frameOk=await extractFrame(video.path,framePath);
          const result=await runFaceMatch({profilePhotoPaths:req.user.photoPaths||[],videoFramePath:frameOk?framePath:null});
          console.log(`[Verification] User ${req.user.id} — score:${result.score} decision:${result.decision}`);
          if(result.passed){
            await store.updateUser(req.user.id,{verificationStatus:'approved',profileVerified:true,verifiedAt:new Date(),faceMatchScore:result.score,faceMatchDetail:result.detail});
          } else if(result.decision==='reject'){
            await store.updateUser(req.user.id,{verificationStatus:'rejected',profileVerified:false,faceMatchScore:result.score,faceMatchDetail:result.detail,rejectReason:'Face did not match profile photos.'});
          } else {
            await store.updateUser(req.user.id,{verificationStatus:'pending',faceMatchScore:result.score,faceMatchDetail:result.detail});
          }
          if(frameOk&&fs.existsSync(framePath)) fs.unlink(framePath,()=>{});
        } catch(err){
          console.error('[Verification] Background error:',err.message);
          await store.updateUser(req.user.id,{verificationStatus:'pending',rejectReason:'Processing error — flagged for manual review.'});
        }
      });
    } catch(err){next(err);}
  }
);

module.exports = router;
