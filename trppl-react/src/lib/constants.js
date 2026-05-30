// src/lib/constants.js

export const COUNTRIES = ['Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];

export const LOVE_LANGUAGES = [
  { id: 'words',   label: 'Words of Affirmation', emoji: '💬', desc: 'Compliments, "I love you", encouragement' },
  { id: 'service', label: 'Acts of Service',       emoji: '🛠', desc: 'Helping out, doing things without being asked' },
  { id: 'gifts',   label: 'Receiving Gifts',       emoji: '🎁', desc: 'Thoughtful presents, tokens of affection' },
  { id: 'time',    label: 'Quality Time',           emoji: '🕐', desc: 'Undivided attention, being truly present' },
  { id: 'touch',   label: 'Physical Touch',         emoji: '🤗', desc: 'Hugs, hand-holding, physical closeness' },
];

export const EDUCATION_OPTIONS = [
  { value: 'high-school',      label: 'High school' },
  { value: 'some-college',     label: 'Some college' },
  { value: 'bachelors',        label: "Bachelor's degree" },
  { value: 'masters',          label: "Master's degree" },
  { value: 'phd',              label: 'PhD / Doctorate' },
  { value: 'trade-school',     label: 'Trade / Vocational school' },
  { value: 'prefer-not-to-say',label: 'Prefer not to say' },
];

export const DRINKING_OPTIONS = [
  { value: 'yes',      label: 'Yes' },
  { value: 'socially', label: 'Socially' },
  { value: 'no',       label: 'No' },
];

export const SMOKING_OPTIONS   = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
export const HAVEKIDS_OPTIONS  = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
export const WANTKIDS_OPTIONS  = [
  { value: 'yes',      label: 'Yes' },
  { value: 'no',       label: 'No' },
  { value: 'open',     label: 'Open to it' },
  { value: 'not-sure', label: 'Not sure' },
];

export const ZODIAC_OPTIONS = [
  { value: 'aries',       label: '♈ Aries (Mar 21 – Apr 19)' },
  { value: 'taurus',      label: '♉ Taurus (Apr 20 – May 20)' },
  { value: 'gemini',      label: '♊ Gemini (May 21 – Jun 20)' },
  { value: 'cancer',      label: '♋ Cancer (Jun 21 – Jul 22)' },
  { value: 'leo',         label: '♌ Leo (Jul 23 – Aug 22)' },
  { value: 'virgo',       label: '♍ Virgo (Aug 23 – Sep 22)' },
  { value: 'libra',       label: '♎ Libra (Sep 23 – Oct 22)' },
  { value: 'scorpio',     label: '♏ Scorpio (Oct 23 – Nov 21)' },
  { value: 'sagittarius', label: '♐ Sagittarius (Nov 22 – Dec 21)' },
  { value: 'capricorn',   label: '♑ Capricorn (Dec 22 – Jan 19)' },
  { value: 'aquarius',    label: '♒ Aquarius (Jan 20 – Feb 18)' },
  { value: 'pisces',      label: '♓ Pisces (Feb 19 – Mar 20)' },
];

export const RELIGION_OPTIONS = [
  { value: 'christianity',   label: 'Christianity' },
  { value: 'islam',          label: 'Islam' },
  { value: 'hinduism',       label: 'Hinduism' },
  { value: 'judaism',        label: 'Judaism' },
  { value: 'buddhism',       label: 'Buddhism' },
  { value: 'sikhism',        label: 'Sikhism' },
  { value: 'spiritual',      label: 'Spiritual but not religious' },
  { value: 'agnostic',       label: 'Agnostic' },
  { value: 'atheist',        label: 'Atheist' },
  { value: 'other',          label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export const DATE_TYPES = [
  { value: 'coffee',   label: 'Coffee',   emoji: '☕' },
  { value: 'dinner',   label: 'Dinner',   emoji: '🍽️' },
  { value: 'drinks',   label: 'Drinks',   emoji: '🍹' },
  { value: 'activity', label: 'Activity', emoji: '🎯' },
  { value: 'virtual',  label: 'Virtual',  emoji: '💻' },
];

export const LABEL_MAPS = {
  education: Object.fromEntries(EDUCATION_OPTIONS.map(o => [o.value, o.label])),
  drinking:  Object.fromEntries(DRINKING_OPTIONS.map(o => [o.value, o.label])),
  smoking:   Object.fromEntries(SMOKING_OPTIONS.map(o => [o.value, o.label])),
  haveKids:  Object.fromEntries(HAVEKIDS_OPTIONS.map(o => [o.value, o.label])),
  wantKids:  Object.fromEntries(WANTKIDS_OPTIONS.map(o => [o.value, o.label])),
  zodiac:    Object.fromEntries(ZODIAC_OPTIONS.map(o => [o.value, o.label.split(' ')[0] + ' ' + o.label.split(' ')[1]])),
  religion:  Object.fromEntries(RELIGION_OPTIONS.map(o => [o.value, o.label])),
};

export const MOCK_PROFILES = [
  { id: 'f1', name: 'Sophie',  age: 27, sex: 'female', city: 'Manchester', country: 'United Kingdom', compatibility: 94, loveLangs: ['Words of Affirmation', 'Quality Time'],  color: '#7c3aed' },
  { id: 'f2', name: 'Emma',    age: 25, sex: 'female', city: 'Leeds',       country: 'United Kingdom', compatibility: 88, loveLangs: ['Acts of Service', 'Physical Touch'],     color: '#ec4899' },
  { id: 'f3', name: 'Layla',   age: 29, sex: 'female', city: 'Sheffield',   country: 'United Kingdom', compatibility: 81, loveLangs: ['Quality Time', 'Receiving Gifts'],       color: '#0ea5e9' },
  { id: 'f4', name: 'Priya',   age: 24, sex: 'female', city: 'Bradford',    country: 'United Kingdom', compatibility: 85, loveLangs: ['Receiving Gifts', 'Words of Affirmation'],color: '#f59e0b' },
  { id: 'f5', name: 'Hannah',  age: 28, sex: 'female', city: 'Huddersfield',country: 'United Kingdom', compatibility: 79, loveLangs: ['Acts of Service'],                       color: '#8b5cf6' },
  { id: 'm1', name: 'James',   age: 28, sex: 'male',   city: 'Manchester',  country: 'United Kingdom', compatibility: 91, loveLangs: ['Quality Time', 'Acts of Service'],       color: '#0ea5e9' },
  { id: 'm2', name: 'Marcus',  age: 26, sex: 'male',   city: 'Leeds',       country: 'United Kingdom', compatibility: 83, loveLangs: ['Physical Touch', 'Words of Affirmation'],color: '#7c3aed' },
  { id: 'm3', name: 'Daniel',  age: 30, sex: 'male',   city: 'Sheffield',   country: 'United Kingdom', compatibility: 77, loveLangs: ['Receiving Gifts', 'Quality Time'],       color: '#ec4899' },
  { id: 'm4', name: 'Liam',    age: 25, sex: 'male',   city: 'Barnsley',    country: 'United Kingdom', compatibility: 89, loveLangs: ['Words of Affirmation'],                  color: '#16a34a' },
  { id: 'm5', name: 'Oliver',  age: 29, sex: 'male',   city: 'Halifax',     country: 'United Kingdom', compatibility: 74, loveLangs: ['Quality Time'],                          color: '#8b5cf6' },
];
