import https from 'node:https';

const urls = [
  "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea",
  "https://images.unsplash.com/photo-1555680202-c86f0e12f086",
  "https://images.unsplash.com/photo-1518770660439-4636190af475",
  "https://images.unsplash.com/photo-1563770660941-20978e870e26",
  "https://images.unsplash.com/photo-1592652434685-6d0061e8ce12",
  "https://images.unsplash.com/photo-1597843793617-64906bfba098",
  "https://images.unsplash.com/photo-1544654803-b69140b285a1",
  "https://images.unsplash.com/photo-1591488320449-011701bb6704",
  "https://images.unsplash.com/photo-1587202372644-c2c310c3ed62",
  "https://images.unsplash.com/photo-1555617947-6571fa0884d8",
  "https://images.unsplash.com/photo-1549429440-d9da1b15ceaa",
  "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc",
  "https://images.unsplash.com/photo-1593640408182-31c70c8268f5",
  "https://images.unsplash.com/photo-1595225476474-87563907a212",
  "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb"
];

for (const u of urls) {
  https.get(u, (res) => {
    console.log(res.statusCode, u);
  });
}
