import { usePreferences } from '../features/settings/Preferences';
// English source keys are intentionally shared with server-configured copy.
// Clinic names, doctor names and prescription instructions remain supplied content.
const hi: Record<string, string> = {
  Home: 'होम',
  Bookings: 'बुकिंग',
  Medicines: 'दवाइयाँ',
  Profile: 'प्रोफ़ाइल',
  Everyday: 'सामान्य',
  Diwali: 'दीवाली',
  'Book a visit': 'अपॉइंटमेंट बुक करें',
  Consult: 'परामर्श',
  'Lab tests': 'लैब जाँच',
  Pharmacy: 'फ़ार्मेसी',
  Vaccines: 'टीके',
  'How can we help?': 'हम कैसे मदद कर सकते हैं?',
  Book: 'बुक करें',
  Prescriptions: 'प्रिस्क्रिप्शन',
  Reminders: 'अनुस्मारक',
  Family: 'परिवार',
  'Care, close to home': 'घर के पास देखभाल',
  'People you can trust': 'भरोसेमंद डॉक्टर',
  'Health check': 'स्वास्थ्य जाँच',
  'Blood tests': 'रक्त जाँच',
  'Doctor visit': 'डॉक्टर से मिलें',
  Vaccination: 'टीकाकरण',
  Popular: 'लोकप्रिय',
  'A complete health picture': 'आपके स्वास्थ्य की पूरी जानकारी',
  'Simple, reliable screening': 'सरल, भरोसेमंद जाँच',
  'Care that listens to you': 'आपकी बात सुनने वाली देखभाल',
  'Protection for your family': 'आपके परिवार की सुरक्षा',
  'Good morning, Lakshmi': 'नमस्ते, लक्ष्मी',
  'A little care.\nA healthier day.': 'थोड़ी देखभाल।\nस्वस्थ जीवन।',
  'Trusted care for you and the people you love.':
    'आपके और आपके परिवार के लिए भरोसेमंद देखभाल।',
  'Happy Diwali, Lakshmi': 'दीवाली की शुभकामनाएँ, लक्ष्मी',
  'A brighter Diwali.\nA healthier you.': 'उजली दीवाली।\nस्वस्थ आप।',
  'Celebrate with a little care for the whole family.':
    'पूरे परिवार के स्वास्थ्य का ध्यान रखकर मनाएँ।',
  'A gift of good health': 'अच्छे स्वास्थ्य का उपहार',
  'Family checkup': 'परिवार की जाँच',
  'Health screening': 'स्वास्थ्य परीक्षण',
  'Family doctor': 'पारिवारिक डॉक्टर',
  'Flu vaccination': 'फ़्लू का टीका',
  'Diwali special': 'दीवाली विशेष',
  'Your care, your way': 'आपकी देखभाल, आपके तरीके से',
  'One familiar place for your family.': 'आपके परिवार के लिए एक भरोसेमंद जगह।',
  Settings: 'सेटिंग्स',
  Language: 'भाषा',
  'Dark mode': 'डार्क मोड',
  'Haptic feedback': 'स्पर्श प्रतिक्रिया',
  'Medicine reminders': 'दवा अनुस्मारक',
  'Enable reminders': 'अनुस्मारक चालू करें',
  'Disable reminders': 'अनुस्मारक बंद करें',
  'Test reminder in 10 seconds': '10 सेकंड में अनुस्मारक जाँचें',
  'Live config editor': 'लाइव कॉन्फ़िग संपादक',
  'Edit configuration': 'कॉन्फ़िग संपादित करें',
  'Apply configuration': 'कॉन्फ़िग लागू करें',
  'Restore bundled configuration': 'मूल कॉन्फ़िग वापस लाएँ',
  Close: 'बंद करें',
  Save: 'सहेजें',
  'Switch to Diwali home': 'दीवाली होम चुनें',
  'Switch to everyday home': 'सामान्य होम चुनें',
  'Your bookings': 'आपकी बुकिंग',
  'Your next visit starts here': 'आपकी अगली मुलाकात यहाँ से शुरू होती है',
  'Meet the doctors at your neighbourhood clinic.':
    'अपने नज़दीकी क्लिनिक के डॉक्टरों से मिलें।',
  'Explore your clinic': 'क्लिनिक देखें',
  Confirmed: 'पुष्टि हो गई',
  'Pending confirmation': 'पुष्टि की प्रतीक्षा',
  'Doctor consultation': 'डॉक्टर से परामर्श',
  'Book a clinic visit': 'क्लिनिक में मुलाकात बुक करें',
  'Choose a date': 'तारीख चुनें',
  'Choose a time': 'समय चुनें',
  Today: 'आज',
  Unavailable: 'उपलब्ध नहीं',
  'Clinic time · IST': 'क्लिनिक समय · IST',
  'Confirm booking': 'बुकिंग की पुष्टि करें',
  'Try confirmation again': 'फिर पुष्टि करें',
  'Visit confirmed': 'मुलाकात की पुष्टि हो गई',
  'You’re all booked.': 'आपकी बुकिंग हो गई।',
  'We’ll be ready to welcome you.': 'हम आपके स्वागत के लिए तैयार रहेंगे।',
  'View my booking': 'मेरी बुकिंग देखें',
  'That slot was just booked.': 'यह समय अभी बुक हो गया।',
  'Choose another available time. Your doctor and date are saved.':
    'दूसरा उपलब्ध समय चुनें। डॉक्टर और तारीख सुरक्षित हैं।',
  'We couldn’t confirm your visit': 'मुलाकात की पुष्टि नहीं हो सकी',
  'No appointment was saved. Try confirming again.':
    'कोई अपॉइंटमेंट सहेजा नहीं गया। फिर कोशिश करें।',
  'Select a date and available time to continue.':
    'जारी रखने के लिए तारीख और उपलब्ध समय चुनें।',
  'You’ll see confirmation once the clinic accepts your time.':
    'क्लिनिक द्वारा समय स्वीकार करने पर पुष्टि दिखाई देगी।',
  'Confirming your visit…': 'मुलाकात की पुष्टि हो रही है…',
  'Your prescriptions': 'आपके प्रिस्क्रिप्शन',
  'Your medicine schedule': 'आपकी दवा का समय',
  'Today’s schedule': 'आज का समय',
  Morning: 'सुबह',
  Afternoon: 'दोपहर',
  Night: 'रात',
  'Mark taken': 'ले ली',
  'Taken · Undo': 'ले ली · वापस करें',
  'View medicines': 'दवाइयाँ देखें',
  'No medicines': 'कोई दवा नहीं',
  'Course complete': 'दवा का कोर्स पूरा',
  'Dose history unavailable': 'दवा का इतिहास उपलब्ध नहीं',
  'Your prescriptions will appear here': 'आपके प्रिस्क्रिप्शन यहाँ दिखेंगे',
  'After a clinic visit, your medicines and daily schedule will be together here.':
    'क्लिनिक में मुलाकात के बाद आपकी दवाइयाँ और समय यहाँ दिखेंगे।',
  'We couldn’t load your prescriptions': 'प्रिस्क्रिप्शन लोड नहीं हो सके',
  'Retry prescriptions': 'फिर कोशिश करें',
  'Back to home': 'होम पर लौटें',
  'View prescription list': 'प्रिस्क्रिप्शन सूची देखें',
  'Prescription unavailable': 'प्रिस्क्रिप्शन उपलब्ध नहीं',
  'Back to prescriptions': 'प्रिस्क्रिप्शन पर लौटें',
  'Offline booking': 'ऑफ़लाइन बुकिंग',
  'Simulate offline': 'ऑफ़लाइन स्थिति आज़माएँ',
  'Offline · cached times only': 'ऑफ़लाइन · सहेजे हुए समय',
  Online: 'ऑनलाइन',
  'Queue booking': 'बुकिंग कतार में रखें',
  'Saved for sync': 'सिंक के लिए सहेजा गया',
  'Your request is saved on this device. It is not confirmed yet.':
    'अनुरोध इस डिवाइस पर सहेजा गया है। अभी पुष्टि नहीं हुई है।',
  'Queued · awaiting connection': 'कतार में · कनेक्शन की प्रतीक्षा',
  'Syncing…': 'सिंक हो रहा है…',
  'Needs a new time': 'नया समय चुनें',
  'Sync failed · retry': 'सिंक विफल · फिर कोशिश करें',
  'Sync now': 'अभी सिंक करें',
  'Choose another time': 'दूसरा समय चुनें',
  'Remove request': 'अनुरोध हटाएँ',
  'Assignment demo controls': 'असाइनमेंट डेमो नियंत्रण',
  'Normal network': 'सामान्य नेटवर्क',
  'Slow network': 'धीमा नेटवर्क',
  'Restore normal responses': 'सामान्य प्रतिक्रियाएँ वापस लाएँ',
  Retry: 'फिर कोशिश करें',
};
export function translate(text: string, language: 'en' | 'hi'): string {
  if (language === 'en') return text;
  if (hi[text]) return hi[text];
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (hi[normalized]) return hi[normalized];
  const progress = normalized.match(/^(\d+) of (\d+) doses taken(?: today)?$/);
  if (progress) return `${progress[2]} में से ${progress[1]} खुराक ली गई`;
  const count = normalized.match(/^(\d+) (medicines?|doses?)$/);
  if (count)
    return `${count[1]} ${
      count[2]?.startsWith('medicine') ? 'दवाइयाँ' : 'खुराक'
    }`;
  if (normalized.startsWith('Visit fee · '))
    return normalized.replace('Visit fee', 'परामर्श शुल्क');
  if (normalized.startsWith('Booking reference · '))
    return normalized.replace('Booking reference', 'बुकिंग क्रमांक');
  return text;
}
export function useTranslate() {
  const { language } = usePreferences();
  return (text: string) => translate(text, language);
}
