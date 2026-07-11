/**
 * Sample dataset: "Ram Jewellers", a mid-size jeweler.
 * Generated as real WhatsApp export text so the demo runs through the
 * actual parser — what you see is exactly what an upload produces.
 */

const OWNER = 'Ram Jewellers';
const ANCHOR = new Date(2026, 6, 10, 20, 0, 0).getTime(); // 10 Jul 2026
const DAY = 24 * 60 * 60 * 1000;

type Line = [daysAgo: number, who: 'c' | 'o', text: string];

function fmt(ts: number): string {
  const d = new Date(ts);
  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  const yy = String(d.getFullYear()).slice(2);
  let h = d.getHours();
  const mer = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy}, ${h}:${min} ${mer}`;
}

function chat(customer: string, lines: Line[]): { name: string; content: string } {
  let lastDay = -1;
  let minuteOfDay = 0;
  const out: string[] = [];
  for (const [daysAgo, who, text] of lines) {
    if (daysAgo !== lastDay) {
      lastDay = daysAgo;
      // start each day mid-morning; deterministic pseudo-scatter by day number
      minuteOfDay = 10 * 60 + ((daysAgo * 37) % 360);
    } else {
      minuteOfDay += 3 + ((daysAgo + minuteOfDay) % 9);
    }
    const ts = ANCHOR - daysAgo * DAY - (20 * 60 - minuteOfDay) * 60 * 1000;
    const sender = who === 'c' ? customer : OWNER;
    out.push(`${fmt(ts)} - ${sender}: ${text}`);
  }
  return {
    name: `WhatsApp Chat with ${customer}.txt`,
    content: out.join('\n'),
  };
}

export const SAMPLE_FILES: { name: string; content: string }[] = [
  // ─── Priya Sharma — active VIP, daughter's wedding in November ───
  chat('Priya Sharma', [
    [430, 'c', 'Hello, I saw your shop on Instagram. Do you have temple jewellery?'],
    [430, 'o', 'Yes madam, we have a full temple jewellery collection. You are welcome to visit'],
    [430, 'c', 'What is the gold rate today?'],
    [430, 'o', 'Today 22k is 7,150 per gram madam'],
    [402, 'c', 'I want to order the lakshmi pendant we saw, size medium'],
    [402, 'o', 'Sure madam, it will be ready in 10 days. 30% advance'],
    [402, 'c', 'Ok done, sending advance on gpay'],
    [398, 'o', 'Advance received, thank you madam'],
    [210, 'c', 'The pendant was lovely. Everyone asked where I got it'],
    [210, 'o', 'Thank you so much madam, means a lot'],
    [95, 'c', 'Good news — my daughter wedding is fixed for November'],
    [95, 'c', 'We will need the full bridal set. Necklace, haram, bangles, vaddanam'],
    [95, 'o', 'Congratulations madam! Please visit with your daughter, we will plan everything'],
    [94, 'c', 'What will be the budget for a good bridal set around 250 grams?'],
    [94, 'o', 'Around 18-20 lakhs depending on designs madam. We can also exchange your old gold'],
    [30, 'c', 'We are coming Saturday to finalise designs'],
    [30, 'o', 'Perfect madam, I will keep the new bridal catalogue ready'],
    [8, 'c', 'Can you send photo of the antique haram you mentioned?'],
    [8, 'o', 'Sending in the evening madam, photoshoot is happening today'],
    [3, 'c', 'Also my sister wants matching earrings, what will be the price?'],
    [3, 'o', 'Around 85,000 madam, I will confirm the exact weight tomorrow'],
  ]),

  // ─── Rajesh Kumar — DORMANT VIP: heavy Dhanteras buyer, silent 5 months ───
  chat('Rajesh Kumar', [
    [610, 'c', 'Ram bhai, Dhanteras ke liye coins available hain?'],
    [610, 'o', 'Haan bhai, 5g 10g 20g sab hai. Lakshmi ji wale bhi'],
    [610, 'c', '10g ke 4 coins book kar do'],
    [609, 'o', 'Done bhai, bill bana diya. Delivery Dhanteras se ek din pehle'],
    [580, 'c', 'Coins mil gaye, mast quality. Thank you'],
    [430, 'c', 'Wife ke liye anniversary gift chahiye, kuch dikhao'],
    [430, 'o', 'Diamond pendant set dikhata hoon bhai, aapke budget me best'],
    [428, 'c', 'Price kitna hai?'],
    [428, 'o', '1.2 lakh bhai, certificate ke saath'],
    [427, 'c', 'Thoda discount karo, purana customer hoon'],
    [427, 'o', 'Aapke liye 1.1 final bhai'],
    [426, 'c', 'Done. Saturday aa raha hoon payment leke'],
    [250, 'c', 'Bhai gold rate kya chal raha hai aajkal?'],
    [250, 'o', '22k 6,950 chal raha hai bhai'],
    [249, 'c', 'Accha, Dhanteras pe phir coins lene hain. Bata dena rate'],
    [155, 'c', 'Bhai ek quotation bhej do 50g ke coins ka, office gifting ke liye'],
    [155, 'o', 'Bhej raha hoon bhai, corporate discount bhi lagega'],
  ]),

  // ─── Meera Reddy — HOT LEAD: new customer, asking prices, awaiting reply ───
  chat('Meera Reddy', [
    [12, 'c', 'Hi, got your number from Sunita aunty. Do you make custom nakshi work?'],
    [12, 'o', 'Yes madam, nakshi and kundan both. Custom orders take 3 weeks'],
    [11, 'c', 'I need a nakshi choker for my sister sagai next month'],
    [11, 'o', 'Beautiful choice madam. Around 40-50 grams works best for chokers'],
    [10, 'c', 'What will be the making charges?'],
    [10, 'o', 'For nakshi work 18% madam, it is fully handmade'],
    [5, 'c', 'Ok. Can you share the catalogue? And is advance booking rate possible?'],
    [5, 'c', 'Also do you accept EMI?'],
  ]),

  // ─── Anjali Gupta — DORMANT VIP: bridal purchase 10 months ago, silent ───
  chat('Anjali Gupta', [
    [340, 'c', 'Hello, we are looking for bridal sets for my wedding in two months'],
    [340, 'o', 'Congratulations madam! Please visit, full bridal floor is ready'],
    [335, 'c', 'We visited yesterday. Papa liked the polki set. What is the final price?'],
    [335, 'o', 'With exchange of your old gold, 14.5 lakhs madam'],
    [334, 'c', 'Ok we want to book it. How much advance?'],
    [334, 'o', '20% madam. Rest on delivery'],
    [333, 'c', 'Paid on UPI, please confirm'],
    [333, 'o', 'Received madam, thank you. Delivery in 3 weeks with hallmark certificate'],
    [310, 'c', 'Set received!! It is stunning, thank you so much'],
    [310, 'o', 'Wishing you a very happy married life madam'],
    [305, 'c', 'Will send my cousin also, she is getting engaged soon'],
  ]),

  // ─── Vikram Singh — active regular: monthly gold coin investor ───
  chat('Vikram Singh', [
    [200, 'c', 'Monthly 5g coin book karna hai, SIP jaisa'],
    [200, 'o', 'Bilkul sir, har month rate lock karke bhej dunga'],
    [170, 'c', 'Is month ka coin ready?'],
    [170, 'o', 'Ready sir, aa jaiye shop pe'],
    [140, 'c', 'Rate kya hai is month?'],
    [140, 'o', '7,020 per gram sir'],
    [110, 'c', 'Coin collect kar liya, next month bhi book'],
    [75, 'c', 'Bhai is baar 10g karna hai, bonus aaya hai'],
    [75, 'o', 'Badhiya sir! 10g book kar diya'],
    [40, 'c', 'Collected. Rate badh raha hai lagta hai'],
    [40, 'o', 'Haan sir, isliye SIP sahi chal raha hai aapka'],
    [6, 'c', 'July ka coin ready hai kya?'],
    [6, 'o', 'Haan sir, kal se collect kar sakte hain'],
  ]),

  // ─── Suresh Patel — regular, anniversary coming up ───
  chat('Suresh Patel', [
    [380, 'c', 'Do you repair old jewellery? My mother chain is broken'],
    [380, 'o', 'Yes sir, free for our customers. Bring it over'],
    [370, 'c', 'Collected the chain, good work'],
    [90, 'c', 'My 25th anniversary is coming in August, want something special for wife'],
    [90, 'o', 'Silver jubilee sir! Diamond solitaire ring would be perfect'],
    [88, 'c', 'What is the price range?'],
    [88, 'o', 'Good solitaires start from 1.5 lakh sir'],
    [20, 'c', 'Ok I will come this month end to select'],
    [20, 'o', 'Sure sir, I will keep 5-6 options ready'],
  ]),

  // ─── Lakshmi Iyer — new customer, engagement shopping ───
  chat('Lakshmi Iyer', [
    [18, 'c', 'Hello, do you have light weight daily wear collections?'],
    [18, 'o', 'Yes madam, 2g to 8g daily wear range is very popular'],
    [16, 'c', 'My engagement is next month, need a ring for him also'],
    [16, 'o', 'Congratulations madam! Gents rings 8g onwards, platinum also available'],
    [15, 'c', 'Platinum price per gram?'],
    [15, 'o', '3,400 per gram madam plus making'],
    [14, 'c', 'Ok will visit this weekend with my fiance'],
    [14, 'o', 'Most welcome madam'],
  ]),

  // ─── Kavita Joshi — active VIP: boutique reseller, bulk orders ───
  chat('Kavita Joshi', [
    [300, 'c', 'Hi Ram ji, I run a boutique in Jubilee Hills. Interested in wholesale silver'],
    [300, 'o', 'Namaste madam, yes we do wholesale. GST bill ke saath'],
    [295, 'c', 'Send me the catalogue and price list'],
    [295, 'o', 'Sent on email madam. Bulk order pe 12% margin'],
    [290, 'c', 'First order: 30 pieces anklets, 20 oxidised sets'],
    [290, 'o', 'Order confirmed madam, dispatch in 5 days'],
    [240, 'c', 'Stock almost over, repeat order please. Same quantities'],
    [180, 'c', 'Navratri collection chahiye, colorful beads wala'],
    [180, 'o', 'New Navratri line launch ho rahi hai madam, photos bhejta hoon'],
    [120, 'c', 'Order: 50 pieces mixed. Also customers asking for temple jewellery'],
    [120, 'o', 'Adding temple pieces to your order madam'],
    [45, 'c', 'Wedding season stock karna hai. Big order aayega is baar'],
    [45, 'o', 'Ready madam, priority dispatch aapke liye'],
    [9, 'c', 'Sent the order list on email, please confirm and send invoice'],
    [9, 'o', 'Confirmed madam, invoice by tomorrow'],
  ]),

  // ─── Farhan Ali — mid-value, gone quiet 3 months ───
  chat('Farhan Ali', [
    [400, 'c', 'Salaam bhai, Eid ke liye kuch gift options dikhao ammi ke liye'],
    [400, 'o', 'Walaikum salaam bhai. Gold jhumke ya silver payal, dono me acha range hai'],
    [398, 'c', 'Jhumke ka rate batao'],
    [398, 'o', '12g wale 90,000 ke around bhai'],
    [396, 'c', 'Book kar do, Eid se pehle chahiye'],
    [396, 'o', 'Done bhai, 3 din me ready'],
    [390, 'c', 'Mil gaye, ammi bahut khush. Shukriya bhai'],
    [98, 'c', 'Bhai wife ke liye bracelet dekhna hai, budget 40k'],
    [98, 'o', 'Aa jao bhai, 15-20 options hain us range me'],
  ]),

  // ─── Deepak Nair — low-intent browser ───
  chat('Deepak Nair', [
    [150, 'c', 'Hi, are you open on Sundays?'],
    [150, 'o', 'Yes sir, 11am to 8pm'],
    [60, 'c', 'Just checking, do you sell silver gift articles?'],
    [60, 'o', 'Yes sir, full gifting section is there'],
  ]),
];

export const SAMPLE_BUSINESS = OWNER;
