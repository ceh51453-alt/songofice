export const CHARACTER_PORTRAITS: Record<string, string[]> = {
  // Collection 1
  "Aegon Gardener": ["Aegon Gardener.png"],
  "Aegon Targaryen": ["Aegon Targaryen.png"],
  "Aerys II Targaryen": ["Aerys II Targaryen.png"],
  "Argella Durrandon": ["Argella Durrandon.png"],
  "Argilac Durrandon": ["Argilac Durrandon.png"],
  "Corlys Velaryon": ["Corlys Velaryon.png"],
  "Daemon Velaryon": ["Daemon Velaryon.png"],
  "Eddard Stark": ["Eddard Stark.png"],
  "Edmyn Tully": ["Edmyn Tully.png"],
  "Elia Martell": ["Elia Martell.png"],
  "Harren the Black": ["Harren the Black.png"],
  "Hoster Tully": ["Hoster Tully.png"],
  "Howland Reed": ["Howland Reed.png"],
  "Jon Arryn": ["Jon Arryn.png"],
  "Jon Connington": ["Jon Connington.png"],
  "Loren Lannister": ["Loren Lannister.png"],
  "Meria Martell": ["Meria Martell.png"],
  "Mern IX Gardener": ["Mern IX Gardener.png"],
  "Orys Baratheon": ["Orys Baratheon.png"],
  "Quenton Qoherys": ["Quenton Qoherys.png"],
  "Rhaegar Targaryen": ["Rhaegar Targaryen.png"],
  "Rhaenys Targaryen": ["Rhaenys Targaryen.png"],
  "Robert Baratheon": ["Robert Baratheon.png"],
  "Ronnel Arryn": ["Ronnel Arryn.png"],
  "Sharra Arryn": ["Sharra Arryn.png"],
  "son of harren": ["son of harren.png"],
  "Stannis Baratheon": ["Stannis Baratheon.png"],
  "Torrhen Stark": ["Torrhen Stark.png"],
  "Vickon Greyjoy": ["Vickon Greyjoy.png"],
  "Visenya Targaryen": ["Visenya Targaryen.png"],

  // Collection 2
  "Arianne Martell": ["Arianne Martell.png"],
  "Arya Stark": ["arya stark.png"],
  "Asha Greyjoy": ["Asha Greyjoy.png"],
  "Ashara Dayne": ["Ashara Dayne.png"],
  "Brienne of Tarth": ["Brienne of Tarth.png"],
  "Bà Già Nan": ["Ba Gia Nan.png"],
  "Catelyn Stark": ["catelyn stark.png"],
  "Catelyn Tully": ["catelyn tully.png"],
  "Cersei Lannister": ["Cersei Lannister.png"],
  "Dacey Mormont": ["Dacey Mormont.png"],
  "Daenerys Targaryen": ["Daenerys Targaryen 14t.png", "Daenerys Targaryen 14t 2.png", "Daenerys Targaryen 14t 3.png"],
  "Ellaria Sand": ["Ellaria Sand.png"],
  "Gilly": ["Gilly.png"],
  "Irri": ["irri handmaid.png"],
  "Jhiqui": ["Jhiqui.png"],
  "Lyanna Stark": ["lyanna stark 1.png"],
  "Lysa Arryn": ["Lysa Arryn.png"],
  "Lysa Tully": ["lysa tully.png"],
  "Maege Mormont": ["Maege Mormont.png"],
  "Margaery Tyrell": ["Margaery Tyrell.png", "Margaery Tyrell 16t.png"],
  "Meera Reed": ["Meera Reed.png"],
  "Melisandre": ["Melisandre.png"],
  "Missandei": ["Missandei.png"],
  "Myrcella Baratheon": ["myrcella baratheon.png"],
  "Nymeria Sand": ["Nymeria Sand.png"],
  "Obara Sand": ["Obara Sand.png"],
  "Olenna Tyrell": ["Olenna Tyrell.png"],
  "Osha": ["Osha.png"],
  "Rhaella Targaryen": ["Rhaella Targaryen.png"],
  "Sansa Stark": ["Sansa Stark.png"],
  "Selyse Baratheon": ["Selyse Baratheon.png"],
  "Shae": ["Shae.png"],
  "Shireen Baratheon": ["shireen baratheon.png"],
  "Tyene Sand": ["Tyene Sand.png"],
  "Val": ["val wildling.png"],
  "Ygritte": ["Ygritte.png"],
};

export const SORTED_CHARS = Object.keys(CHARACTER_PORTRAITS).sort((a, b) => b.length - a.length);
export const CHAR_REGEX = new RegExp(`\\b(${SORTED_CHARS.join('|')})\\b`, 'gi');

export const CHARACTER_BIRTH_YEARS: Record<string, number> = {
  "Daenerys Targaryen": 284,
  "Margaery Tyrell": 283,
  "Lyanna Stark": 267,
};

export function getPortraitForCharacter(name: string, currentYear: number): string {
  const images = CHARACTER_PORTRAITS[name];
  if (!images || images.length === 0) return "";
  
  if (images.length === 1) return images[0];
  
  const birthYear = CHARACTER_BIRTH_YEARS[name];
  if (!birthYear) {
    return images[Math.floor(Math.random() * images.length)];
  }
  
  const age = currentYear - birthYear;
  
  const ageImages: { img: string, ageReq: number }[] = [];
  for (const img of images) {
    const match = img.match(/(\d+)t/);
    if (match) {
      ageImages.push({ img, ageReq: parseInt(match[1]) });
    } else {
      // Mặc định ảnh không ghi số tuổi là lúc trưởng thành (ví dụ 18+)
      ageImages.push({ img, ageReq: 18 });
    }
  }
  
  // Tìm các ảnh có độ tuổi yêu cầu <= tuổi hiện tại
  const validImages = ageImages.filter(x => x.ageReq <= age);
  if (validImages.length === 0) {
    // Nếu nhân vật trẻ hơn tất cả các ảnh, lấy ảnh trẻ nhất
    ageImages.sort((a, b) => a.ageReq - b.ageReq);
    return ageImages[0].img;
  }
  
  // Lấy các ảnh có độ tuổi sát nhất với tuổi hiện tại
  const maxValidAgeReq = Math.max(...validImages.map(x => x.ageReq));
  const bestImages = validImages.filter(x => x.ageReq === maxValidAgeReq);
  
  return bestImages[Math.floor(Math.random() * bestImages.length)].img;
}
