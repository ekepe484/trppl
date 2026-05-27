// backend/db/store.js
const crypto = require('crypto');
const config = require('../config');
const { query } = require('./pool');

function rowToUser(row) {
  if (!row) return null;
  return {
    id:                 row.id,
    email:              row.email,
    passwordHash:       row.password_hash,
    name:               row.name,
    username:           row.username,
    sex:                row.sex,
    dob:                row.dob,
    height:             row.height,
    phone:              row.phone,
    phoneVerified:      row.phone_verified,
    city:               row.city,
    country:            row.country,
    contactMethod:      row.contact_method,
    photoPaths:         row.photo_paths || [],
    education:          row.education,
    drinking:           row.drinking,
    smoking:            row.smoking,
    haveKids:           row.have_kids,
    wantKids:           row.want_kids,
    zodiac:             row.zodiac,
    religion:           row.religion,
    createdAt:          row.created_at,
    emailVerified:      row.email_verified,
    profileVerified:    row.profile_verified,
    verificationStatus: row.verification_status,
    selfiePath:         row.selfie_path,
    videoPath:          row.video_path,
    faceMatchScore:     row.face_match_score,
    faceMatchDetail:    row.face_match_detail,
    rejectReason:       row.reject_reason,
    verifiedAt:         row.verified_at,
  };
}

async function createUser({ email, phone, passwordHash, name, username, sex, dob, height, city, country, contactMethod, photoPaths, education, drinking, smoking, haveKids, wantKids, zodiac, religion }) {
  const { rows } = await query(
    `INSERT INTO users
       (email, phone, password_hash, name, username, sex, dob, height,
        city, country, contact_method, photo_paths,
        education, drinking, smoking, have_kids, want_kids, zodiac, religion)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     RETURNING *`,
    [
      email ? email.toLowerCase().trim() : null,
      phone || null,
      passwordHash,
      name.trim(),
      username ? username.toLowerCase().trim() : null,
      sex || null,
      dob,
      height || null,
      city || null,
      country || null,
      contactMethod || 'email',
      photoPaths || [],
      education || null,
      drinking  || null,
      smoking   || null,
      haveKids  || null,
      wantKids  || null,
      zodiac    || null,
      religion  || null,
    ]
  );
  return rowToUser(rows[0]);
}

async function getUserById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id=$1', [id]);
  return rowToUser(rows[0]||null);
}
async function getUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email=$1', [email.toLowerCase().trim()]);
  return rowToUser(rows[0]||null);
}
async function getUserByPhone(phone) {
  const { rows } = await query('SELECT * FROM users WHERE phone=$1', [phone]);
  return rowToUser(rows[0]||null);
}
async function getUserByUsername(username) {
  const { rows } = await query('SELECT * FROM users WHERE username=$1', [username.toLowerCase().trim()]);
  return rowToUser(rows[0]||null);
}

const COL = {
  emailVerified:'email_verified', phoneVerified:'phone_verified',
  profileVerified:'profile_verified', verificationStatus:'verification_status',
  selfiePath:'selfie_path', videoPath:'video_path', photoPaths:'photo_paths',
  faceMatchScore:'face_match_score', faceMatchDetail:'face_match_detail',
  rejectReason:'reject_reason', verifiedAt:'verified_at',
  name:'name', username:'username', city:'city', country:'country',
  sex:'sex', phone:'phone', contactMethod:'contact_method',
  height:'height', education:'education', drinking:'drinking',
  smoking:'smoking', haveKids:'have_kids', wantKids:'want_kids',
  zodiac:'zodiac', religion:'religion',
};

async function updateUser(id, fields) {
  const sets=[], vals=[];
  let i=1;
  for(const[k,v] of Object.entries(fields)){const c=COL[k];if(!c)continue;sets.push(`${c}=$${i++}`);vals.push(v);}
  if(!sets.length) return getUserById(id);
  vals.push(id);
  const { rows } = await query(`UPDATE users SET ${sets.join(',')} WHERE id=$${i} RETURNING *`, vals);
  return rowToUser(rows[0]||null);
}

function generateOtp(){return String(Math.floor(Math.random()*Math.pow(10,config.auth.otpLength||6))).padStart(config.auth.otpLength||6,'0');}

async function createOtp({userId,contact,method,purpose}){
  await query(`UPDATE otp_codes SET used=true WHERE user_id=$1 AND purpose=$2 AND used=false`,[userId,purpose]);
  const code=generateOtp();
  const expiresAt=new Date(Date.now()+(config.auth.otpTtl||600000));
  await query(`INSERT INTO otp_codes(user_id,code,contact,method,purpose,expires_at) VALUES($1,$2,$3,$4,$5,$6)`,
    [userId,code,contact,method,purpose,expiresAt]);
  return code;
}

async function verifyOtp({contact,code,purpose}){
  const { rows } = await query(`SELECT * FROM otp_codes WHERE contact=$1 AND purpose=$2 AND used=false ORDER BY created_at DESC LIMIT 1`,[contact,purpose]);
  if(!rows.length) return {ok:false,reason:'not_found'};
  const otp=rows[0];
  if(otp.attempts>=5){await query('UPDATE otp_codes SET used=true WHERE id=$1',[otp.id]);return {ok:false,reason:'too_many_attempts'};}
  await query('UPDATE otp_codes SET attempts=attempts+1 WHERE id=$1',[otp.id]);
  if(new Date(otp.expires_at)<new Date()){await query('UPDATE otp_codes SET used=true WHERE id=$1',[otp.id]);return {ok:false,reason:'expired'};}
  if(otp.code!==code) return {ok:false,reason:'wrong_code'};
  await query('UPDATE otp_codes SET used=true WHERE id=$1',[otp.id]);
  return {ok:true,userId:otp.user_id};
}

function publicUser(user){
  if(!user) return null;
  const {passwordHash,selfiePath,videoPath,...pub}=user;
  return pub;
}

module.exports = { createUser, getUserById, getUserByEmail, getUserByPhone, getUserByUsername, updateUser, createOtp, verifyOtp, publicUser };
