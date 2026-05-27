// backend/routes/auth.js
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');
const router   = express.Router();
const config   = require('../config');
const store    = require('../store');
const { sendOtp } = require('../otp');
const { authLimiter } = require('../middleware');
const { requireAuth } = require('../middleware/auth');

const photoDir = path.resolve(config.uploads.dir,'photos');
if(!fs.existsSync(photoDir)) fs.mkdirSync(photoDir,{recursive:true});
const photoStorage = multer.diskStorage({
  destination:(_req,_file,cb)=>cb(null,photoDir),
  filename:(_req,file,cb)=>cb(null,`${uuidv4()}${path.extname(file.originalname).toLowerCase()}`),
});
const photoUpload = multer({
  storage:photoStorage,
  limits:{fileSize:config.uploads.maxSize,files:6},
  fileFilter:(_req,file,cb)=>{const ok=['image/jpeg','image/png','image/webp','image/heic'].includes(file.mimetype);cb(ok?null:new Error('Only JPEG/PNG/WEBP/HEIC images allowed.'),ok);}
});

function signToken(userId){return jwt.sign({sub:userId},config.auth.jwtSecret,{expiresIn:config.auth.jwtExpiresIn});}
function validateEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}
function validatePhone(p){return /^\+?[1-9]\d{6,14}$/.test(p.replace(/\s/g,''));}
function validatePassword(pw){return typeof pw==='string'&&pw.length>=8&&/[a-zA-Z]/.test(pw)&&/\d/.test(pw);}
function normalisePhone(p){const n=p.replace(/\s/g,'');return n.startsWith('+')?n:'+'+n;}

const COUNTRIES=['Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];

router.post('/register', authLimiter, photoUpload.array('photos',6), async (req,res,next)=>{
  try {
    const {
      fullName, username, sex, dob, height,
      city, country, contactMethod, email, phone, password,
      education, drinking, smoking, haveKids, wantKids, zodiac, religion,
    } = req.body;

    const errors = {};

    if (!fullName || fullName.trim().length < 2)
      errors.fullName = 'Full name must be at least 2 characters.';
    if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username))
      errors.username = 'Username must be 3–20 characters (letters, numbers, underscores).';
    if (!sex || !['male','female'].includes(sex))
      errors.sex = 'Please select your sex.';
    if (!dob) {
      errors.dob = 'Date of birth is required.';
    } else if ((new Date() - new Date(dob)) / (365.25*24*60*60*1000) < 18) {
      errors.dob = 'You must be 18 or older.';
    }
    if (!height) errors.height = 'Please select your height.';
    if (!city || city.trim().length < 2) errors.city = 'City is required.';
    if (!country || !COUNTRIES.includes(country)) errors.country = 'Please select a valid country.';

    // Lifestyle fields
    const EDUCATION_VALS = ['high-school','some-college','bachelors','masters','phd','trade-school','prefer-not-to-say'];
    const DRINKING_VALS  = ['yes','socially','no'];
    const SMOKING_VALS   = ['yes','no'];
    const HAVEKIDS_VALS  = ['yes','no'];
    const WANTKIDS_VALS  = ['yes','no','open','not-sure'];
    const ZODIAC_VALS    = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
    const RELIGION_VALS  = ['christianity','islam','hinduism','judaism','buddhism','sikhism','spiritual','agnostic','atheist','other','prefer-not-to-say'];

    if (!education || !EDUCATION_VALS.includes(education)) errors.education = 'Please select your education level.';
    if (!drinking  || !DRINKING_VALS.includes(drinking))   errors.drinking  = 'Please select your drinking habit.';
    if (!smoking   || !SMOKING_VALS.includes(smoking))     errors.smoking   = 'Please select.';
    if (!haveKids  || !HAVEKIDS_VALS.includes(haveKids))   errors.haveKids  = 'Please select.';
    if (!wantKids  || !WANTKIDS_VALS.includes(wantKids))   errors.wantKids  = 'Please select.';
    if (!zodiac    || !ZODIAC_VALS.includes(zodiac))       errors.zodiac    = 'Please select your zodiac sign.';
    if (!religion  || !RELIGION_VALS.includes(religion))   errors.religion  = 'Please select.';

    if (!['email','phone'].includes(contactMethod))
      errors.contactMethod = 'Choose email or phone.';
    if (contactMethod === 'email') {
      if (!email || !validateEmail(email)) errors.email = 'Enter a valid email address.';
    } else {
      if (!phone || !validatePhone(phone)) errors.phone = 'Enter a valid phone number with country code.';
    }
    if (!validatePassword(password))
      errors.password = 'Password must be at least 8 characters with letters and numbers.';

    const uploadedPhotos = req.files || [];
    if (uploadedPhotos.length === 0) errors.photos = 'At least one photo is required.';

    if (Object.keys(errors).length > 0) {
      uploadedPhotos.forEach(f => fs.unlink(f.path, ()=>{}));
      return res.status(400).json({ error: 'Validation failed.', fields: errors });
    }

    const normEmail = contactMethod === 'email' ? email.toLowerCase().trim() : null;
    const normPhone = contactMethod === 'phone' ? normalisePhone(phone) : null;
    if (normEmail && await store.getUserByEmail(normEmail)) return res.status(409).json({ error: 'An account with this email already exists.' });
    if (normPhone && await store.getUserByPhone(normPhone)) return res.status(409).json({ error: 'An account with this phone already exists.' });
    if (await store.getUserByUsername(username)) return res.status(409).json({ error: 'That username is already taken.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const photoPaths   = uploadedPhotos.map(f => f.path);
    const user = await store.createUser({
      email: normEmail, phone: normPhone, passwordHash,
      name: fullName.trim(), username: username.toLowerCase().trim(),
      sex, dob, height, city: city.trim(), country, contactMethod, photoPaths,
      education, drinking, smoking,
      haveKids, wantKids, zodiac, religion,
    });

    const contact = contactMethod === 'email' ? normEmail : normPhone;
    const code    = await store.createOtp({ userId: user.id, contact, method: contactMethod, purpose: 'register' });
    await sendOtp({ method: contactMethod, to: contact, name: user.name, code, purpose: 'register' });

    res.status(201).json({
      message:       `Account created! We sent a code to ${contactMethod === 'email' ? normEmail : 'your phone'}.`,
      userId:        user.id,
      contactMethod,
      contact:       contactMethod === 'email' ? normEmail : normPhone.slice(0,-6) + '******',
    });
  } catch(err) { next(err); }
});

router.post('/verify-otp', authLimiter, async (req,res,next)=>{
  try {
    const{contact,code,purpose}=req.body;
    if(!contact||!code||!purpose) return res.status(400).json({error:'contact, code and purpose are required.'});
    const result=await store.verifyOtp({contact,code:code.trim(),purpose});
    if(!result.ok){const msgs={not_found:'No pending verification found.',expired:'Code has expired.',wrong_code:'Incorrect code. Please try again.',too_many_attempts:'Too many attempts. Request a new code.'};return res.status(400).json({error:msgs[result.reason]||'Invalid code.'});}
    const isPhone=contact.startsWith('+');
    const user=await store.updateUser(result.userId,isPhone?{phoneVerified:true}:{emailVerified:true});
    res.json({message:`${isPhone?'Phone':'Email'} verified!`,token:signToken(user.id),user:store.publicUser(user)});
  } catch(err){next(err);}
});

router.post('/resend-otp', authLimiter, async (req,res,next)=>{
  try {
    const{contact,purpose}=req.body;
    if(!contact) return res.status(400).json({error:'contact is required.'});
    const isPhone=contact.startsWith('+');
    const user=isPhone?await store.getUserByPhone(contact):await store.getUserByEmail(contact);
    if(!user) return res.json({message:'If that account exists, a new code has been sent.'});
    const method=isPhone?'phone':'email';
    const code=await store.createOtp({userId:user.id,contact,method,purpose:purpose||'register'});
    await sendOtp({method,to:contact,name:user.name,code,purpose:purpose||'register'});
    res.json({message:`New code sent to ${isPhone?'your phone':contact}.`});
  } catch(err){next(err);}
});

router.post('/login', authLimiter, async (req,res,next)=>{
  try {
    const{contact,password}=req.body;
    if(!contact||!password) return res.status(400).json({error:'Contact and password are required.'});
    const isPhone=/^\+/.test(contact.trim());
    const user=isPhone?await store.getUserByPhone(normalisePhone(contact)):await store.getUserByEmail(contact);
    const dummy='$2a$12$invalidhashpadding000000000000000000000000000000000000';
    if(!user){await bcrypt.compare(password,dummy);return res.status(401).json({error:'Invalid credentials.'});}
    const valid=await bcrypt.compare(password,user.passwordHash);
    if(!valid) return res.status(401).json({error:'Invalid credentials.'});
    res.json({token:signToken(user.id),user:store.publicUser(user)});
  } catch(err){next(err);}
});

router.get('/check-username', async(req,res,next)=>{
  try{const{username}=req.query;if(!username) return res.status(400).json({error:'username required.'});const existing=await store.getUserByUsername(username);res.json({available:!existing});}catch(err){next(err);}
});

router.get('/me', requireAuth, (req,res)=>res.json({user:store.publicUser(req.user)}));

module.exports = router;
