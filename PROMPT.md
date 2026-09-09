# Prompt tạo ảnh cho game (AI-ảnh-ngoài)

Quyết định Phase 0: nhân vật/đồ vật/ảnh nền trong game sẽ tạo bằng công
cụ AI ảnh bên ngoài (không phải SVG tự code) — xem lý do trong
`ROADMAP.md`. Tài liệu này là quy trình lặp lại cho mỗi ảnh mới, không
riêng con vật (đã mở rộng sang nhân vật, đồ vật, ảnh nền theo từng game
mới) — đổi tên từ `ANIMAL_ART_PIPELINE.md` sang `PROMPT.md` cho đúng
phạm vi hiện tại.

**Đổi phong cách (sau phản hồi "chưa đẹp, chưa sinh động"):** bản đầu
dùng phong cách "semi-realistic" (giống ảnh chụp thật) — nhìn không khớp
với avatar hoạt hình dễ thương ở màn chọn hồ sơ, 2 phong cách chọi nhau.
Đổi hẳn sang phong cách **chibi/hoạt hình dễ thương** (mắt to long lanh,
tỉ lệ đầu to, tô màu vector mềm mại) theo đúng ảnh mẫu người dùng gửi —
đồng bộ với avatar, đồng bộ cả bộ. Con vật cũng không còn "đi lại" trong
game nữa (xem Bước 4) nên KHÔNG cần mô tả dáng đi/bước chân như trước —
chỉ cần 1 dáng đứng/ngồi đơn giản, thoải mái.

## Mục lục

- [Bước 1 — Bạn tạo ảnh](#buoc-1)
- [Bước 2 — Gửi ảnh cho tôi](#buoc-2)
- [Bước 3 — Tôi xử lý (tự động)](#buoc-3)
- [Bước 4 — Chuyển động trong game (đã đổi lại sau nhiều vòng thử)](#buoc-4)
- [Bước 5 — Danh sách 10 con vật MVP (Sở thú)](#buoc-5)
- [Bước 6 — Danh sách 10 "Động vật nuôi" (nhóm con thứ 2 trong "Con vật")](#buoc-6)
- [Bước 7 — Ảnh nền "khu rừng" (thay cho nền vẽ bằng code hiện tại)](#buoc-7)
- [Bước 8 — Thêm 10 con "Động vật hoang dã" (đợt 2) cho Khu rừng kỳ bí](#buoc-8)
- [Bước 9 — Ảnh nền "nông trại" cho game #2 "Nông trại của bé"](#buoc-9)
- [Bước 10 — Thêm 10 con "Động vật nuôi" (đợt 2) cho Nông trại của bé](#buoc-10)
- [Bước 11 — Gửi ảnh qua Git thay vì dán vào khung chat (đỡ tốn token)](#buoc-11)
- [Bước 12 — Nhân vật "Bill" cho game #3](#buoc-12)
- [Bước 13 — 10 đồ vật ở trường cho game #3](#buoc-13)
- [Bước 14 — Ảnh nền "sân trường" cho game #3](#buoc-14)
- [Bước 15 — Thêm 10 đồ vật ở trường (đợt 2) cho game #3](#buoc-15)
- [Bước 16 — Bộ ảnh cho game #4 "How Many?"](#buoc-16)
- [Bước 17 — 10 ảnh con số 1-10 dễ thương, thay cho đếm hình lặp lại](#buoc-17)

<a id="buoc-1"></a>
## Bước 1 — Bạn tạo ảnh

Copy đoạn "Khung phong cách" bên dưới + đoạn prompt riêng của con vật cần
tạo, dán vào **1 công cụ AI ảnh miễn phí** (Google ImageFX, Bing Image
Creator/Microsoft Designer, Leonardo.ai gói free, hoặc Google Flow/Imagen
nếu có). Đặt tỉ lệ khung hình **1:1 (vuông)** nếu công cụ cho chọn.

### Khung phong cách (dán trước, dùng chung cho MỌI con vật)

```
Cute chibi-style baby animal character illustration for a children's
mobile game, flat vector cartoon art style with soft cel-shading and
gentle gradient highlights, oversized round head with a much smaller
compact body (chibi/baby proportions), extremely large glossy round
eyes with a bright white catchlight sparkle, tiny nose, simple happy
or curious facial expression, smooth rounded shapes with no sharp
edges, thin clean dark outline around the whole character, saturated
warm and cheerful color palette, simple relaxed standing or sitting
pose facing slightly to the side, both front paws/feet resting on the
ground, centered on a plain solid white (#FFFFFF) background, no
ground shadow, no scenery, no other characters, no text, no
watermark, no logo, square 1:1 composition, character fills about
75-85% of the frame.
Avoid: realistic or semi-realistic proportions, photographic texture,
walking pose, human clothing, multiple characters in frame, cropped
body parts, background scenery, text or watermark.
```

### Prompt riêng: Hổ (Tiger)

```
A baby Bengal tiger character, sitting or standing calmly facing
slightly to the side, small rounded ears, short tail curled gently
near the body, vivid orange fur with bold black stripes, white
underbelly and chin/muzzle, big sparkling amber eyes, cheerful
friendly expression.
```

Tạo vài phiên bản (thường công cụ cho ra 2–4 ảnh/lượt), chọn ảnh **ưng ý
nhất** — ưu tiên ảnh có nền trắng sạch, mắt to đúng phong cách chibi,
không bị cắt cụt chân/đuôi/tai, và **hợp phong cách với các con đã có**
(so sánh nhanh với ảnh cũ nếu đang thay dần từng con một).

<a id="buoc-2"></a>
## Bước 2 — Gửi ảnh cho tôi

Tải ảnh về (PNG), gửi trực tiếp vào cuộc trò chuyện này.

<a id="buoc-3"></a>
## Bước 3 — Tôi xử lý (tự động)

1. Chạy `tools/remove_white_bg.py` (đã có sẵn trong repo, dùng kỹ thuật
   tô loang từ viền ảnh — không đục lỗ vào lông trắng bên trong con vật)
   để tách nền trắng → nền trong suốt
2. Tối ưu kích thước file cho web/mobile
3. Đặt tên theo đúng chuẩn trong `content-schema.json`
   (`assets/animals/tiger.png`)
4. Ghép vào bản demo "sân chơi" để bạn xem thử cảm giác chuyển động thật
   trong game

<a id="buoc-4"></a>
## Bước 4 — Chuyển động trong game (đã đổi lại sau nhiều vòng thử)

Đã thử qua 4 kiểu chuyển động khác nhau (chạy tự do, núp bụi cây, 4 hàng
đi ngang...) — đều bị chê "rối"/"không đẹp hơn". **Chốt cuối cùng: con vật
đứng yên tại chỗ (không di chuyển vị trí), chỉ có 1 hiệu ứng "lắc lư nhẹ
nhàng"** (CSS xoay qua lại vài độ, như đang thở) — mỗi ô lệch giờ 1 chút
để không đồng bộ tăm tắp trông máy móc. Đơn giản, không rối mắt, nhưng
vẫn có sức sống hơn hẳn ảnh đứng im 100%. Khi bấm đúng: ảnh phát video
(nếu có) tiếp tục lặp, kèm hiệu ứng nảy + hạt "ăn mừng" bắn ra + tiếng
chuông ting.

<a id="buoc-5"></a>
## Bước 5 — Danh sách 10 con vật MVP (Sở thú)

Chọn theo 3 tiêu chí: quen thuộc với trẻ lớp 1, dáng vẻ khác biệt rõ (để
bé nhận ra nhanh khi chơi), và đi/di chuyển được rõ ràng bằng ảnh tĩnh.
10 con là đủ đa dạng cho vòng học ngắt quãng mà không quá tải công sức
tạo ảnh (mỗi con cần tạo + duyệt thủ công).

- [x] Hổ (Tiger)
- [x] Sư Tử (Lion)
- [x] Voi (Elephant)
- [x] Hươu Cao Cổ (Giraffe)
- [x] Ngựa Vằn (Zebra)
- [x] Khỉ (Monkey)
- [x] Gấu (Bear)
- [x] Chuột Túi (Kangaroo)
- [x] Gấu Trúc (Panda)
- [x] Cá Sấu (Crocodile)

### Prompt riêng cho từng con (dáng đứng/ngồi đơn giản — không cần dáng đi)

```
Sư Tử (Lion):
A baby lion character, standing or sitting calmly, thick fluffy
golden-brown mane framing the round face, short tail with a small dark
tuft, tawny golden fur, lighter cream underbelly, big sparkling eyes,
confident cheerful expression.

Voi (Elephant):
A baby elephant character, standing calmly, large round flapping ears,
short trunk gently curled, tiny visible tusks, soft grey skin, rounded
plump body, big sparkling eyes, gentle happy expression.

Hươu Cao Cổ (Giraffe):
A baby giraffe character, standing calmly, a shorter and slightly
curved neck (cute proportions, not too long), short horn-like
ossicones on top of the head, tan coat with brown patchwork spots,
lighter cream underbelly, big sparkling eyes, gentle happy expression.

Ngựa Vằn (Zebra):
A baby zebra character, standing calmly, short upright mane, short
tail with a dark tuft, white coat with bold black stripes covering the
whole body including the legs and mane, big sparkling eyes, friendly
alert expression.

Khỉ (Monkey):
A baby capuchin monkey character, sitting calmly, long curved tail
curled to one side, light brown fur with a paler face and chest, big
sparkling eyes, curious playful expression.

Gấu (Bear):
A baby brown bear character, standing or sitting calmly, round ears,
short stubby tail, plump rounded body, thick brown fur, big sparkling
eyes, gentle happy expression.

Chuột Túi (Kangaroo):
A baby kangaroo character, standing upright on its hind legs and tail
for balance, small front paws held close to the chest, sandy brown
fur, lighter cream underbelly with a visible front pouch, big
sparkling eyes, friendly alert expression.

Gấu Trúc (Panda):
A baby giant panda character, sitting calmly, round plump body, black
ears and black patches around the eyes, white coat with bold black
patches on the ears, eyes, legs, and shoulders, big sparkling eyes,
gentle happy expression.

Cá Sấu (Crocodile):
A baby crocodile character, lying or sitting low to the ground with a
rounded friendly body shape (not too long/low), short snout with a
few visible teeth, smooth rounded bumpy texture, tail curled gently to
one side, olive-green skin with a lighter cream underside, big
sparkling eyes, cheerful expression.
```

Sau 10 con này, thêm con mới chỉ cần lặp lại đúng công thức: Khung phong
cách (không đổi) + 1 đoạn mô tả riêng theo mẫu trên (loài + màu/hoạ tiết
đặc trưng + dáng đứng/ngồi đơn giản, không cần mô tả dáng đi).

<a id="buoc-6"></a>
## Bước 6 — Danh sách 10 "Động vật nuôi" (nhóm con thứ 2 trong "Con vật")

Nhóm vật nuôi/nông trại quen thuộc với trẻ Việt Nam — **đã đưa vào
`content/packs/animals-v1.json`** làm nhóm con `subcategory: "pet"`
("Động vật nuôi") song song nhóm `"wild"` ("Động vật hoang dã"), cùng 1
category "Con vật" (không tách category riêng — xem phần "Nhóm con
(subcategory)" trong `ROADMAP.md` để hiểu vì sao). "Thế giới động vật"
(khu rừng) chỉ lấy nhóm `wild`, không đụng đến nhóm này.

**Ảnh hiện tại vẫn là ảnh raster cũ từ Phase 0** (phong cách
"semi-realistic + dáng đi", theo đúng prompt cũ bên dưới) — CHƯA khớp
phong cách chibi mới đã đổi cho 10 con Sở thú ở Bước 5. Cần tạo lại ảnh
chibi cho cả 10 con này theo đúng khung phong cách ở Bước 1 (bỏ hết mô tả
dáng đi, chuyển sang dáng đứng/ngồi đơn giản — xem cách viết lại prompt ở
Bước 5 làm mẫu) rồi tải lên qua Trang phụ huynh (chọn Bộ từ "Con vật" →
Nhóm con "Động vật nuôi" → chọn đúng con cần thay → tải ảnh mới), **không
cần đổi tên/mã (id)** vì id đã đặt đúng theo `text_en` sẵn (dog/cat/hen/
duck/pig/cow/buffalo/horse/goat/rabbit).

- [x] Chó (Dog)
- [x] Mèo (Cat)
- [x] Gà (Chicken/Hen)
- [x] Vịt (Duck)
- [x] Lợn/Heo (Pig)
- [x] Bò (Cow)
- [x] Trâu (Water Buffalo)
- [x] Ngựa (Horse)
- [x] Dê (Goat)
- [x] Thỏ (Rabbit)

### Prompt riêng cho từng con

```
Chó (Dog):
A Shiba Inu dog, walking to the right, front-right leg stepping forward
and back-left leg stepping forward (walking gait), fluffy curled tail
held up, perked triangular ears, friendly happy expression with tongue
slightly out, cream and orange-brown fur coat, white chest and paws.

Mèo (Cat):
A domestic short-hair cat, walking to the right, front-right leg
stepping forward and back-left leg stepping forward (walking gait),
tail raised with a gentle curve at the tip, upright pointed ears, calm
curious expression, orange tabby fur with darker stripe markings, white
chest and paws.

Gà (Chicken/Hen):
A hen, walking to the right, taking a step with one leg forward in a
bird's walking gait, small wings held close to the body, red comb on
top of the head and a small red wattle under the beak, alert curious
expression, warm brown and cream speckled feathers.

Vịt (Duck):
A white duck, walking to the right with a gentle waddling gait, one
webbed foot stepping forward, wings held close to the body, orange flat
bill and orange webbed feet, friendly calm expression, plush white
feathers.

Lợn/Heo (Pig):
A pink pig, walking to the right, front-right leg stepping forward and
back-left leg stepping forward (walking gait), round snout, small
upright triangular ears, curly short tail, cheerful friendly
expression, smooth pink skin with a plump rounded body.

Bò (Cow):
A dairy cow, walking to the right, front-right leg stepping forward and
back-left leg stepping forward (walking gait), short curved horns, long
tail with a tuft at the tip swaying gently, gentle calm expression,
white coat with black patches.

Trâu (Water Buffalo):
A water buffalo, walking to the right, front-right leg stepping forward
and back-left leg stepping forward (walking gait), long curved
backward-sweeping horns, sturdy heavy build, calm gentle expression,
dark grey wet-looking skin.

Ngựa (Horse):
A brown horse, walking to the right, front-right leg stepping forward
and back-left leg stepping forward (walking gait), flowing dark mane
and tail, alert gentle expression, glossy chestnut brown coat, black
lower legs and hooves.

Dê (Goat):
A white goat, walking to the right, front-right leg stepping forward
and back-left leg stepping forward (walking gait), short curved horns,
a small tuft of beard fur under the chin, alert curious expression,
white shaggy coat.

Thỏ (Rabbit):
A white rabbit, captured mid-hop moving to the right, both powerful
hind legs pushing off the ground together, front paws tucked close to
the chest, long upright ears, round fluffy tail, gentle curious
expression, soft white fur with pink inner ears.
```

<a id="buoc-7"></a>
## Bước 7 — Ảnh nền "khu rừng" (thay cho nền vẽ bằng code hiện tại)

Nền hiện tại (`--sky-top/--sky-mid/--sky-bottom` gradient + dải "canopy"
+ dải "ground" + mặt trời + mây, tất cả vẽ bằng CSS/SVG trong
`index.html`, lớp `.world-bg`) dùng chung cho **toàn bộ app** (mọi màn
hình, không chỉ riêng Thế giới động vật). Đây là phần sẽ được **thay
bằng 1 ảnh nền vẽ tay/AI** thay vì code — sống động hơn, có núi non
sông nước như ảnh mẫu người dùng mô tả.

**Cách dùng:** copy nguyên đoạn prompt bên dưới, dán vào công cụ AI ảnh
(Google ImageFX, Bing Image Creator, Leonardo.ai...), chọn tỉ lệ khung
hình **dọc (portrait) 9:16** nếu công cụ cho chọn (khớp màn hình điện
thoại). Tạo vài phiên bản, chọn ảnh ưng ý nhất rồi gửi trực tiếp vào
cuộc trò chuyện — tôi sẽ resize/tối ưu và ghép thành nền thật cho app
(thay `.world-bg`).

```
Vibrant, cheerful flat-vector cartoon illustration of a lush jungle
forest landscape, background art for a children's mobile learning
game, in the same cute soft cel-shaded style as a chibi baby-animal
character illustration (smooth rounded shapes, no sharp or scary
edges, thin clean outlines on major shapes, warm saturated colors,
gentle gradient lighting). A warm cream-to-soft-green sky gradient at
the top with a few fluffy white clouds and a warm glowing sun. In the
middle distance, soft rounded mountain peaks and rolling green hills
layered with a light misty haze. A gentle winding blue river with
sparkling highlights flows from the mountains through a grassy
clearing toward the bottom of the frame. Lush rounded trees, palm
fronds, and leafy bushes with soft foliage clusters frame the left and
right edges of the image, leaving the center and lower-middle area of
the frame open as empty grassy ground (this open space is reserved for
game characters that will be placed on top later, so keep it visually
calm and uncluttered, not the busiest part of the image). Bright,
inviting, playful mood. Portrait orientation, 9:16 aspect ratio,
full-bleed edge-to-edge illustration filling the entire frame.
Absolutely no animals, no people, no characters, no text, no letters,
no logo, no watermark anywhere in the image.
Avoid: photographic or realistic rendering, 3D render look, dark or
scary mood, cluttered or busy composition, any animal or human
character, any text or watermark, cropped or off-center composition.
```

Lưu ý khi chọn ảnh: ưu tiên ảnh có **khoảng trống rõ ràng ở giữa và
phía dưới khung hình** (nơi các con vật trong game sẽ hiển thị đè lên
trên) — tránh ảnh có quá nhiều chi tiết rậm rạp ngay giữa khung, sẽ làm
con vật khó nhìn khi đặt chồng lên.

Khác với ảnh con vật (Bước 1-6), ảnh nền này **không cần xoá nền/nền
trong suốt** — giữ nguyên làm 1 ảnh nền đầy khung (JPG/PNG đều được).

<a id="buoc-8"></a>
## Bước 8 — Thêm 10 con "Động vật hoang dã" (đợt 2) cho Khu rừng kỳ bí

Mở rộng vốn từ cho trò chơi "Khu rừng kỳ bí" (hiện chỉ lấy nhóm con
`subcategory: "wild"` — xem Bước 6) — chọn 10 con tiếp theo khác hẳn
dáng vẻ với 10 con Sở thú đã có (Bước 5: hổ/sư tử/voi/hươu cao cổ/ngựa
vằn/khỉ/gấu/chuột túi/gấu trúc/cá sấu) để bé dễ phân biệt, đều là con
vật hoang dã quen thuộc, phổ biến với trẻ lớp 1.

Quy trình giống hệt Bước 1-3: dùng đúng "Khung phong cách" ở Bước 1 +
1 đoạn prompt riêng bên dưới, dán vào Google Flow (hoặc ImageFX/Bing
Image Creator...), tỉ lệ khung hình **1:1 (vuông)**, dáng đứng/ngồi đơn
giản (không cần dáng đi — xem lý do ở Bước 4). Tạo xong tải PNG về, gửi
vào cuộc trò chuyện này để tôi tự xoá nền + tối ưu + ghép vào game.

- [ ] Sói (Wolf)
- [ ] Cáo (Fox)
- [ ] Hươu/Nai (Deer)
- [ ] Hà Mã (Hippo)
- [ ] Tê Giác (Rhino)
- [ ] Gấu Túi Koala (Koala)
- [ ] Công (Peacock)
- [ ] Sóc (Squirrel)
- [ ] Gấu Mèo (Raccoon)
- [ ] Chim Cánh Cụt (Penguin)

### Prompt riêng cho từng con

```
Sói (Wolf):
A baby wolf character, sitting or standing calmly, pointed upright
ears, bushy tail curled near the body, thick fluffy grey fur with a
lighter cream chest and muzzle, big sparkling amber eyes, gentle
curious expression.

Cáo (Fox):
A baby red fox character, sitting or standing calmly, large pointed
ears, bushy tail with a white tip curled near the body, vivid
orange-red fur with a white chest and chin, black lower legs, big
sparkling eyes, playful curious expression.

Hươu/Nai (Deer):
A baby deer (fawn) character, standing or sitting calmly, small soft
antlers or antler buds on top of the head, short fluffy tail, tan fur
with soft white spots on the back, lighter cream underbelly, big
sparkling dark eyes, gentle shy expression.

Hà Mã (Hippo):
A baby hippo character, sitting or standing calmly, plump rounded
body, small rounded ears on top of the head, wide friendly snout,
smooth grey skin with a lighter pinkish-grey belly, big sparkling
eyes, cheerful happy expression.

Tê Giác (Rhino):
A baby rhino character, standing or sitting calmly, one small rounded
horn on the snout, sturdy plump rounded body, thick grey skin with
soft rounded folds (not sharp/armored looking), big sparkling eyes,
calm friendly expression.

Gấu Túi Koala (Koala):
A baby koala character, sitting calmly, large round fluffy ears, big
round black nose, plump rounded body, soft grey fur with a lighter
cream chest, big sparkling eyes, sleepy gentle expression, one arm
resting on a short stub of eucalyptus branch beside it.

Công (Peacock):
A baby peacock character, standing calmly, small crest of feathers on
top of the head, short elegant neck, vivid blue-teal chest feathers,
a compact fanned tail with a few soft round eye-spot feather patterns
in teal/green/gold, big sparkling eyes, proud cheerful expression.

Sóc (Squirrel):
A baby squirrel character, sitting upright on its haunches, extremely
large fluffy curled tail arching over its back, small round ears,
reddish-brown fur with a lighter cream chest and belly, tiny paws held
together in front, big sparkling eyes, curious playful expression.

Gấu Mèo (Raccoon):
A baby raccoon character, sitting or standing calmly, distinctive dark
mask marking around the eyes, bushy ringed tail curled near the body,
grey fur with a lighter cream face and chest, rounded ears, big
sparkling eyes, mischievous curious expression.

Chim Cánh Cụt (Penguin):
A baby penguin character, standing upright calmly, small flipper-wings
held close to the round body, glossy black back and head, white belly
and face, small orange-yellow beak and feet, big sparkling eyes,
cheerful happy expression.
```

Lưu file PNG tải về theo đúng tên tiếng Anh không dấu, chữ thường (vd
`wolf.png`, `fox.png`, `deer.png`, `hippo.png`, `rhino.png`,
`koala.png`, `peacock.png`, `squirrel.png`, `raccoon.png`,
`penguin.png`) — trùng đúng mã (id)/`text_en` sẽ dùng khi thêm từ qua
Trang phụ huynh (nút "+" → Bộ từ "Con vật" → Nhóm từ "Động vật hoang
dã" → "➕ Thêm từ mới"), để đỡ phải gõ lại tay.

<a id="buoc-9"></a>
## Bước 9 — Ảnh nền "nông trại" cho game #2 "Nông trại của bé"

Giống hệt Bước 7 (ảnh nền Khu rừng kỳ bí) nhưng đổi bối cảnh sang nông
trại — dùng cho `games/nong-trai-cua-be/farm.css`, file lưu tại
`assets/backgrounds/farm-bg.jpg`.

**Cách dùng:** copy nguyên đoạn prompt bên dưới, dán vào Google Flow (hoặc
ImageFX/Bing Image Creator...), chọn tỉ lệ khung hình **dọc (portrait)
9:16**. Tạo vài phiên bản, chọn ảnh ưng ý nhất — ưu tiên ảnh có **khoảng
trống rõ ràng ở giữa/phía dưới khung hình** (nơi các con vật nuôi trong
game sẽ hiển thị đè lên trên), tránh ảnh quá rậm rạp ngay giữa khung.

```
Vibrant, cheerful flat-vector cartoon illustration of a cozy countryside
farm landscape, background art for a children's mobile learning game,
in the same cute soft cel-shaded style as a chibi baby-animal character
illustration (smooth rounded shapes, no sharp or scary edges, thin
clean outlines on major shapes, warm saturated colors, gentle gradient
lighting). A warm cream-to-soft-blue sky gradient at the top with a few
fluffy white clouds and a warm glowing sun. In the middle distance, a
charming red wooden barn with a white-trimmed roof and a small hayloft
window, next to a simple wooden fence running along a rolling green
pasture, with soft rolling hills layered behind under a light haze. A
narrow dirt path winds from the barn through the grassy field toward
the bottom of the frame. A few round golden haystacks, a cluster of
sunflowers, and a small vegetable garden patch with neat little rows
sit near the edges. Lush leafy trees and bushes frame the left and
right edges of the image, leaving the center and lower-middle area of
the frame open as empty grassy ground (this open space is reserved for
game characters that will be placed on top later, so keep it visually
calm and uncluttered, not the busiest part of the image). Bright,
inviting, playful mood. Portrait orientation, 9:16 aspect ratio,
full-bleed edge-to-edge illustration filling the entire frame.
Absolutely no animals, no people, no characters, no text, no letters,
no logo, no watermark anywhere in the image.
Avoid: photographic or realistic rendering, 3D render look, dark or
scary mood, cluttered or busy composition, any animal or human
character, any text or watermark, cropped or off-center composition.
```

Không cần xoá nền/nền trong suốt (giống Bước 7) — giữ nguyên làm 1 ảnh
nền đầy khung (JPG/PNG đều được).

Ảnh `assets/backgrounds/farm-bg.jpg` đã có (người dùng tự tạo qua Google
Flow, tải về dạng `.jpeg` rồi đổi tên thành `.jpg` — 2 đuôi này là 1
định dạng, chỉ cần đổi tên, không cần chuyển đổi gì). Vị trí crop cho
icon ô chọn game (`.gametile.farm-tile`) đã tinh chỉnh khớp bố cục ảnh
thật (`55% 58% / 220%` — canh vào đoạn đường mòn uốn lượn + cây hai
bên).

<a id="buoc-10"></a>
## Bước 10 — Thêm 10 con "Động vật nuôi" (đợt 2) cho Nông trại của bé

Mở rộng vốn từ cho trò chơi "Nông trại của bé" (nhóm con
`subcategory: "pet"` — xem Bước 6) — chọn 10 con vật nuôi/thú cưng tiếp
theo khác hẳn dáng vẻ với 10 con đã có (Bước 6: chó/mèo/gà/vịt/lợn/bò/
trâu/ngựa/dê/thỏ) để bé dễ phân biệt, đều quen thuộc, phổ biến với trẻ
Việt Nam (cả vật nuôi ngoài sân trại lẫn thú cưng trong nhà).

Quy trình giống hệt Bước 8: dùng đúng "Khung phong cách" ở Bước 1 + 1
đoạn prompt riêng bên dưới, dán vào Google Flow (hoặc ImageFX/Bing Image
Creator...), tỉ lệ khung hình **1:1 (vuông)**, dáng đứng/ngồi đơn giản
(không cần dáng đi — xem lý do ở Bước 4). Tạo xong tải PNG về lưu theo
tên tiếng Anh gợi ý bên dưới.

- [ ] Cừu (Sheep)
- [ ] Ngỗng (Goose)
- [ ] Lừa (Donkey)
- [ ] Bồ Câu (Pigeon)
- [ ] Vẹt (Parrot)
- [ ] Gà Tây (Turkey)
- [ ] Chuột Hamster (Hamster)
- [ ] Chuột Lang (Guinea Pig)
- [ ] Rùa (Tortoise)
- [ ] Chim Cút (Quail)

### Prompt riêng cho từng con

```
Cừu (Sheep):
A baby sheep character, standing or sitting calmly, thick fluffy
cloud-like white wool covering the round body, a small black or pink
face peeking out from the wool, short floppy ears, no horns, big
sparkling eyes, gentle calm expression.

Ngỗng (Goose):
A baby goose character, standing calmly, a long graceful curved neck,
plump rounded white body, an orange flat bill and orange webbed feet,
small wings held close to the body, big sparkling eyes, alert friendly
expression.

Lừa (Donkey):
A baby donkey character, standing or sitting calmly, extra-long
upright ears, a short upright dark mane, grey-brown fur with a lighter
cream muzzle and belly, a thin dark stripe down the back, big
sparkling eyes, gentle patient expression.

Bồ Câu (Pigeon):
A baby pigeon character, standing calmly, a plump rounded body, a
small round head with a short beak, soft grey feathers with a subtle
glossy green-purple sheen around the neck, pink-orange feet, big
sparkling eyes, calm friendly expression.

Vẹt (Parrot):
A baby parrot character, standing or perching calmly, vivid green
feathers with colorful red and yellow accents on the wings, a short
curved beak, big sparkling eyes, cheerful playful expression.

Gà Tây (Turkey):
A baby turkey character, standing calmly, a compact fanned tail with
soft round brown and cream feather patterns, a small featherless red
head and wattle, plump rounded body, dark brown feathers, big
sparkling eyes, proud cheerful expression.

Chuột Hamster (Hamster):
A baby hamster character, sitting upright on its haunches, an
extremely round plump body, a tiny stubby tail, small round ears,
golden-brown fur with lighter cream cheeks and belly, tiny paws held
together in front, big sparkling eyes, cheerful curious expression.

Chuột Lang (Guinea Pig):
A baby guinea pig character, sitting calmly, a rounded elongated body
with no visible tail, short stubby legs, small rounded ears, soft fur
in patches of white, brown, and black, big sparkling eyes, gentle
curious expression.

Rùa (Tortoise):
A baby tortoise character, standing or sitting calmly, a domed rounded
shell with a soft patchwork pattern in warm brown and cream tones,
short stubby legs, a small head with a gentle smile, big sparkling
eyes, calm friendly expression.

Chim Cút (Quail):
A baby quail character, standing calmly, a small rounded plump body, a
tiny curved feather plume on top of the head, a short tail, warm brown
and cream speckled feathers, tiny feet, big sparkling eyes, alert
curious expression.
```

Lưu file PNG tải về theo đúng tên tiếng Anh không dấu, chữ thường (vd
`sheep.png`, `goose.png`, `donkey.png`, `pigeon.png`, `parrot.png`,
`turkey.png`, `hamster.png`, `guineapig.png`, `tortoise.png`,
`quail.png`) — trùng đúng mã (id)/`text_en` sẽ dùng khi thêm từ qua
Trang phụ huynh (nút "+" → Bộ từ "Con vật" → Nhóm từ "Động vật nuôi" →
"➕ Thêm từ mới"), để đỡ phải gõ lại tay.

<a id="buoc-11"></a>
## Bước 11 — Gửi ảnh qua Git thay vì dán vào khung chat (đỡ tốn token)

Từ game 3 trở đi, dùng cách này thay cho Bước 2 (dán ảnh trực tiếp vào
khung chat) mỗi khi cần gửi ảnh **cần xoá nền** (nhân vật/đồ vật, không
áp dụng cho ảnh nền — xem lý do bên dưới): dán ảnh vào chat tốn khá
nhiều "token" (chi phí xử lý) để tôi "nhìn" thấy ảnh, trong khi qua Git
tôi chỉ cần đọc file trên đĩa — rẻ hơn nhiều, đặc biệt hữu ích khi bạn
tính làm hàng trăm game (rất nhiều ảnh về sau).

**Cách làm** (đúng quy trình git bạn đã quen — add/commit/push):

1. Tải ảnh PNG về **y nguyên** (còn nền trắng, chưa xoá nền) — không cần
   xử lý gì thêm ở máy bạn.
2. Đặt tên file **trùng đúng tên đích cuối cùng** ghi trong prompt bên
   dưới mỗi con/đồ vật (vd `bill-happy.png`) và lưu vào thư mục tạm
   `assets/_raw_incoming/` (tạo thư mục này nếu chưa có).
3. `git add assets/_raw_incoming/... && git commit -m "..." && git push`
   lên đúng nhánh đang làm việc.
4. Nhắn tôi 1 câu ngắn kiểu "đã đẩy xong ảnh Bill vui/buồn" — tôi sẽ tự
   `git pull`, chạy `tools/remove_white_bg.py` + tối ưu + lưu đúng vị
   trí cuối cùng (vd `assets/characters/bill-happy.png`), xoá file tạm
   trong `_raw_incoming/` sau khi xử lý xong — không cần dán ảnh vào
   chat nữa.

**Riêng ảnh nền** (không cần xoá nền, xem Bước 7/9): lưu thẳng vào đúng
vị trí cuối cùng luôn (vd `assets/backgrounds/school-bg.jpg`), không
qua `_raw_incoming/`, đúng như đã làm với `forest-bg.jpg`/`farm-bg.jpg`.

<a id="buoc-12"></a>
## Bước 12 — Nhân vật "Bill" cho game #3

Bill là bạn nhỏ sẽ đứng ở giữa sân trường và "xin" bé chọn đúng đồ vật
(nghe câu "I want a book" → bấm đúng đồ). Cần 3 trạng thái cảm xúc:
**chờ đợi** (mặc định — lúc chưa bấm gì, vừa nghe xong câu hỏi), **vui**
(chọn đúng, đồ bay về bên cạnh) và **buồn** (chọn sai, tay không). Ảnh
mẫu bạn gửi chỉ để tham khảo diện mạo nhân vật (tóc đỏ cam, da sáng, áo
phông xanh dương cổ bẻ, quần soóc xanh navy, giày thể thao trắng) — ảnh
thật sẽ tạo mới theo phong cách chibi đồng bộ với cả app (giống khung
phong cách ở Bước 1, chỉ đổi từ "con vật" sang "bạn nhỏ").

### Khung phong cách (dán trước, dùng chung cho cả 3 trạng thái)

```
Cute chibi-style young boy character illustration for a children's
mobile learning game, flat vector cartoon art style with soft
cel-shading and gentle gradient highlights, oversized round head with a
much smaller compact body (chibi/kid proportions), extremely large
glossy round eyes with a bright white catchlight sparkle, short
tousled ginger/orange-red hair, fair skin with rosy cheeks, wearing a
sky-blue polo shirt with a small collar and navy blue shorts, white
sneakers with a colored stripe, smooth rounded shapes with no sharp
edges, thin clean dark outline around the whole character, saturated
warm and cheerful color palette, standing pose facing slightly to the
side, centered on a plain solid white (#FFFFFF) background, no ground
shadow, no scenery, no other characters, no text, no watermark, no
logo, square 1:1 composition, character fills about 75-85% of the
frame.
Avoid: realistic or photographic proportions, photographic texture,
walking pose, background scenery, multiple characters in frame,
cropped body parts, text or watermark.
```

### Prompt riêng: Bill chờ đợi (ảnh mặc định)

```
The boy standing calmly in a relaxed neutral pose, both hands empty,
one hand resting lightly near his hip and the other hanging loosely at
his side, head tilted slightly to one side as if curiously waiting and
wondering, a soft closed-mouth smile (not a big grin, not sad), calm
patient and expectant expression.
```

Lưu thành `bill-idle.png`.

### Prompt riêng: Bill vui (tay không, chuẩn bị nhận đồ / đang mừng)

```
The boy standing calmly with both arms slightly open and empty hands
at his sides, big bright sparkling eyes, wide cheerful open-mouth
smile, rosy cheeks, an eager excited happy expression as if about to
receive something.
```

Lưu thành `bill-happy.png`.

### Prompt riêng: Bill buồn (tay không, không có đồ)

```
The boy standing with shoulders slightly slumped, both hands empty and
held together in front of him, big sparkling eyes now looking slightly
downcast with a small furrowed brow, a gentle pouty frown, a subtle
single small teardrop at the corner of one eye, a disappointed but
still cute and sympathetic (not scary/crying hard) expression.
```

Lưu thành `bill-sad.png`.

**Cả 3 ảnh (`bill-idle.png`/`bill-happy.png`/`bill-sad.png`) đã có** —
người dùng tạo qua AI rồi gửi qua Git theo đúng quy trình ở Bước 11, đã
xoá nền + tối ưu (900×900) và dùng thật trong game.

<a id="buoc-13"></a>
## Bước 13 — 10 đồ vật ở trường cho game #3

Vốn từ cho game #3 — đồ dùng quen thuộc ở trường/sân trường, đa dạng
mạo từ "a"/"an" để tiện dạy luôn ngữ pháp cơ bản (chỉ "eraser" dùng
"an", còn lại dùng "a").

- [ ] Sách (Book) — *a book*
- [ ] Bút chì (Pencil) — *a pencil*
- [ ] Thước kẻ (Ruler) — *a ruler*
- [ ] Cặp sách (Bag) — *a bag*
- [ ] Bút mực (Pen) — *a pen*
- [ ] Cục tẩy (Eraser) — *an eraser*
- [ ] Bút sáp màu (Crayon) — *a crayon*
- [ ] Quyển vở (Notebook) — *a notebook*
- [ ] Quả bóng (Ball) — *a ball*
- [ ] Mũ (Hat) — *a hat*

**Lưu ý quan trọng — tạo trong 1 cuộc trò chuyện MỚI, tách riêng khỏi
cuộc đã tạo ảnh Bill**: nếu dán prompt đồ vật ngay trong cùng đoạn chat
vừa tạo ảnh Bill (Bước 12), nhiều công cụ AI ảnh (kể cả Google Flow) sẽ
"nhớ" ngữ cảnh nhân vật vừa tạo trước đó và tự chèn Bill vào ảnh đồ vật
dù prompt không hề nhắc tới — đây chính là lỗi bạn gặp phải với ảnh bút
chì. Mở 1 đoạn chat mới hoàn toàn (hoặc dùng nút "New chat"/"làm mới")
trước khi bắt đầu tạo 10 đồ vật ở Bước này, không tái sử dụng đoạn chat
đã tạo Bill hay bất kỳ con vật nào.

### Khung phong cách (dán trước, dùng chung cho MỌI đồ vật)

```
Cute simplified flat-vector illustration of a single everyday school
object ONLY — no character, no person, no boy, no hands, no body parts
anywhere in the image — for a children's learning game, soft
cel-shading with gentle gradient highlights, smooth rounded friendly
shapes with no sharp corners or edges, thin clean dark outline, bright
saturated cheerful colors, a tiny bit of playful personality in the
shape (but no eyes or face on the object itself), centered on a plain
solid white (#FFFFFF) background, no shadow, no scenery, no other
objects, no text, no watermark, no logo, square 1:1 composition, object
fills about 70-80% of the frame, viewed from a friendly three-quarter
angle. The single object floats/sits alone on the white background as
the ONLY subject in the frame.
Avoid: any person, character, boy, child, mascot, hand, arm, or body
part of any kind, realistic or photographic textures, 3D render look,
clutter or multiple objects, added faces/eyes on the object, background
scenery, text or watermark, cropped composition.
```

### Prompt riêng cho từng đồ vật

```
Sách (Book):
A closed children's storybook lying flat, thick colorful hardcover
with a simple friendly star or rainbow doodle on the front cover,
rounded corners, warm orange-red cover color with a cream page edge.

Bút chì (Pencil):
A classic wooden pencil lying diagonally, yellow painted body with a
sharpened grey tip, small pink eraser cap and a thin metal band at the
end.

Thước kẻ (Ruler):
A flat wooden or plastic ruler lying diagonally, light wood-tan color
with simple dark tick marks and numbers along the edge, rounded ends.

Cặp sách (Bag):
A plump rounded children's school backpack, two shoulder straps, one
front pocket, a small top handle, bright cheerful blue and orange
color blocking.

Bút mực (Pen):
A simple rounded ballpoint pen lying diagonally, glossy bright blue
barrel with a silver clip and matching blue cap.

Cục tẩy (Eraser):
A small rectangular eraser with softly rounded corners, two-tone pink
and white coloring, a simple printed brand-style stripe across the
middle.

Bút sáp màu (Crayon):
A single fat rounded crayon standing upright, bright warm red-orange
color with a slightly darker paper wrapper label wrapped around the
middle.

Quyển vở (Notebook):
A closed spiral-bound notebook lying flat, light blue cover with
visible metal spiral binding along the left edge, rounded corners.

Quả bóng (Ball):
A round classic soccer-style ball with simple bold black-and-white
pentagon pattern, a soft cheerful highlight sparkle on the upper-left.

Mũ (Hat):
A simple rounded children's baseball cap viewed from the side, bright
cheerful red color with a small curved brim and a tiny button on top.
```

Lưu file PNG theo đúng tên tiếng Anh không dấu, chữ thường: `book.png`,
`pencil.png`, `ruler.png`, `bag.png`, `pen.png`, `eraser.png`,
`crayon.png`, `notebook.png`, `ball.png`, `hat.png` — gửi qua Git theo
đúng quy trình ở Bước 11.

<a id="buoc-14"></a>
## Bước 14 — Ảnh nền "sân trường" cho game #3

Giống hệt Bước 7/9 (ảnh nền Khu rừng kỳ bí/Nông trại) nhưng đổi bối
cảnh sang sân trường — dùng cho CSS của game #3, file lưu tại
`assets/backgrounds/school-bg.jpg` (gửi thẳng vào đúng vị trí này qua
git, không qua `_raw_incoming/` — xem lý do ở Bước 11).

**Cách dùng:** copy nguyên đoạn prompt bên dưới, dán vào Google Flow
(hoặc ImageFX/Bing Image Creator...), chọn tỉ lệ khung hình **dọc
(portrait) 9:16**. Tạo vài phiên bản, chọn ảnh ưng ý nhất — ưu tiên ảnh
có **khoảng trống rõ ràng ở giữa/phía dưới khung hình** (nơi Bill và
các món đồ trong game sẽ hiển thị đè lên trên), tránh ảnh quá rậm rạp
ngay giữa khung.

```
Vibrant, cheerful flat-vector cartoon illustration of a bright
elementary school playground/schoolyard, background art for a
children's mobile learning game, in the same cute soft cel-shaded
style as a chibi character illustration (smooth rounded shapes, no
sharp or scary edges, thin clean outlines on major shapes, warm
saturated colors, gentle gradient lighting). A warm cream-to-soft-blue
sky gradient at the top with a few fluffy white clouds and a warm
glowing sun. In the middle distance, a friendly two-story school
building with large windows and a small flagpole with a colorful flag
beside it, a section of low playground fence, and a couple of leafy
trees. A light grey paved courtyard path leads from the school
building toward the bottom of the frame, with a simple hopscotch
pattern painted on the pavement to one side. Lush green grass patches
and a few flower bushes frame the left and right edges of the image,
leaving the center and lower-middle area of the frame open as empty
paved courtyard ground (this open space is reserved for a character
and game objects that will be placed on top later, so keep it visually
calm and uncluttered, not the busiest part of the image). Bright,
inviting, playful mood. Portrait orientation, 9:16 aspect ratio,
full-bleed edge-to-edge illustration filling the entire frame.
Absolutely no people, no children, no characters, no text, no letters,
no logo, no watermark anywhere in the image.
Avoid: photographic or realistic rendering, 3D render look, dark or
scary mood, cluttered or busy composition, any human or animal
character, any text or watermark, cropped or off-center composition.
```

Không cần xoá nền/nền trong suốt (giống Bước 7/9) — giữ nguyên làm 1
ảnh nền đầy khung (JPG/PNG đều được).

**Ảnh `assets/backgrounds/school-bg.jpg` đã có** — gửi qua Git theo
đúng quy trình ở Bước 11, dùng thật trong game (`.world-bg.billphoto`
trong `games/bill/bill.css`) và làm nền crop cho icon ô chọn game ở
Trang chủ (`.gametile.bill-tile`).

<a id="buoc-15"></a>
## Bước 15 — Thêm 10 đồ vật ở trường (đợt 2) cho game #3

Mở rộng vốn từ cho trò chơi "Help Bill!" (nhóm con `subcategory:
"school"` trong category `object` — xem Bước 13) — chọn 10 đồ vật tiếp
theo khác hẳn dáng vẻ với 10 món đã có (Bước 13: book/pencil/ruler/bag/
pen/eraser/crayon/notebook/ball/hat), vẫn gần gũi với bé ở trường/lớp
học lớp 1.

Quy trình giống hệt Bước 13: dùng đúng "Khung phong cách" đồ vật ở
Bước 13 (đã sửa để loại trừ nhân vật — nhớ tạo ở **1 cuộc trò chuyện
AI MỚI**, không dùng lại đoạn chat đã tạo Bill/đồ vật đợt 1, xem lý do
ở Bước 13) + 1 đoạn prompt riêng bên dưới, tỉ lệ khung hình **1:1
(vuông)**.

- [ ] Bảng con (Whiteboard) — *a whiteboard*
- [ ] Phấn (Chalk) — *a piece of chalk*
- [ ] Hộp bút (Pencil case) — *a pencil case*
- [ ] Kéo (Scissors) — *scissors* (danh từ luôn số nhiều, không cần "a")
- [ ] Hồ dán (Glue stick) — *a glue stick*
- [ ] Chai nước (Water bottle) — *a water bottle*
- [ ] Hộp cơm (Lunch box) — *a lunch box*
- [ ] Ô/Dù (Umbrella) — *an umbrella*
- [ ] Khăn quàng đỏ (Red scarf) — *a red scarf*
- [ ] Giày (Shoes) — *shoes* (danh từ luôn số nhiều, không cần "a")

### Prompt riêng cho từng đồ vật

```
Bảng con (Whiteboard):
A small rectangular whiteboard/slate for writing, flat white surface
with a simple frame border in a cheerful color, one bottom corner
resting on the ground while slightly leaning back.

Phấn (Chalk):
A single stick of chalk lying diagonally, smooth cylindrical white
body with slightly rounded ends, a small soft puff of white chalk dust
near one tip.

Hộp bút (Pencil case):
A soft rounded zippered pencil case lying flat, cheerful two-tone
color blocking with a visible zipper pull tab on top.

Kéo (Scissors):
A pair of child-safe scissors with rounded blunt tips, two curved
plastic finger-loop handles in bright cheerful colors, blades closed
together.

Hồ dán (Glue stick):
An upright glue stick with its cap removed and resting beside it, a
cylindrical tube body in a bright color with a simple label wrap
around the middle.

Chai nước (Water bottle):
A rounded plastic water bottle standing upright, a colorful screw-on
cap on top, a simple carrying loop, translucent body with a light blue
tint.

Hộp cơm (Lunch box):
A rounded rectangular lunch box standing upright with a simple
clip-latch lid, cheerful two-tone color blocking on the body and lid.

Ô/Dù (Umbrella):
A small closed children's umbrella standing upright, a curved handle
at the bottom, a pointed tip at top, folded fabric in a bright
cheerful color with a strap wrapped around the middle.

Khăn quàng đỏ (Red scarf):
A folded red triangular scarf (Vietnamese young pioneer scarf) draped
in a soft loose loop, smooth silky fabric texture with gently rounded
folds.

Giày (Shoes):
A pair of small children's sneakers standing side by side, rounded toe
shape, white soles, colorful upper fabric with simple shoelaces.
```

Lưu file PNG theo đúng tên tiếng Anh không dấu, chữ thường:
`whiteboard.png`, `chalk.png`, `pencil_case.png`, `scissors.png`,
`glue_stick.png`, `water_bottle.png`, `lunch_box.png`, `umbrella.png`,
`red_scarf.png`, `shoes.png` — gửi qua Git theo đúng quy trình ở
Bước 11 (thư mục `assets/_raw_incoming/`), tôi sẽ tự xoá nền + lưu vào
`assets/objects/`.

<a id="buoc-16"></a>
## Bước 16 — Bộ ảnh cho game #4 "How Many?"

Game #4 hiện chưa có ảnh riêng nào (đang chạy tạm bằng emoji + nền vẽ
CSS mặc định). Cần 4 nhóm ảnh: (1) ảnh nền lớp học, (2) nhân vật "Cú
thông thái" 3 trạng thái cảm xúc (dùng làm cả icon ô chọn game ở Trang
chủ), (3) 4 nút bấm hình hoa để bé "nghe thử", (4) 1 nút xác nhận hình
bảng tính nhỏ. Gửi ảnh qua Git theo đúng quy trình ở Bước 11 — ảnh nền
gửi thẳng vào `assets/backgrounds/`, còn lại (cần xoá nền) gửi qua
`assets/_raw_incoming/`.

**Cập nhật:** đã nhận và ghép xong đủ 4/4 nhóm ảnh (16.1-16.4), xem ghi
chú "✅ Đã có ảnh thật" ở từng mục bên dưới. Game #4 giờ dùng toàn bộ
ảnh thật, không còn phụ thuộc fallback emoji/gradient nữa.

### 16.1 — Ảnh nền lớp học

Giống cách làm ở Bước 7/9/14 (ảnh nền theo game) nhưng đổi bối cảnh
sang **tấm bảng đen trong lớp học**, viền ngoài bảng có trang trí các
số 1-10 vẽ tay dễ thương (phấn màu) — hợp với chủ đề "đếm số" của
game. Tỉ lệ khung hình **dọc (portrait) 9:16**, ưu tiên ảnh có khoảng
trống rõ ràng ở giữa/phía dưới khung hình (nơi các đồ vật cần đếm + nút
bấm sẽ hiển thị đè lên trên).

```
Vibrant, cheerful flat-vector cartoon illustration of a cozy classroom
blackboard scene, background art for a children's mobile learning game,
in the same cute soft cel-shaded style as a chibi character illustration
(smooth rounded shapes, no sharp or scary edges, thin clean outlines on
major shapes, warm saturated colors, gentle gradient lighting). A large
dark green chalkboard fills most of the frame, mounted in a warm
wooden frame, with a thin chalk tray at the bottom holding a few
colorful chalk sticks. Around the border of the chalkboard, cute hand-
drawn colorful chalk doodles of the numbers 1 through 10 are scattered
playfully (different chalk colors like white, yellow, pink, light
blue), along with a few simple chalk doodles of stars and swirls. The
center of the chalkboard is left mostly empty and clean (this open
space is reserved for game objects and buttons that will be placed on
top later, so keep it visually calm and uncluttered). Soft warm
classroom light glows from the top corners. Bright, inviting, playful
mood. Portrait orientation, 9:16 aspect ratio, full-bleed edge-to-edge
illustration filling the entire frame. Absolutely no people, no
children, no characters, no readable words or letters (only playful
numeral doodles 1-10 and simple shapes), no logo, no watermark
anywhere in the image.
Avoid: photographic or realistic rendering, 3D render look, dark or
scary mood, cluttered or busy composition, any human or animal
character, real readable text/sentences, watermark, cropped or
off-center composition.
```

Không cần xoá nền — giữ nguyên làm 1 ảnh nền đầy khung (JPG/PNG đều
được). Lưu thành `assets/backgrounds/howmany-bg.jpg`.

**✅ Đã có ảnh thật** — đã lưu vào `assets/backgrounds/howmany-bg.jpg`,
đang chạy trong game (kể cả icon ô chọn game ở Trang chủ, crop nhỏ từ
chính ảnh này).

### 16.2 — Nhân vật "Cú thông thái" (3 trạng thái + icon ô chọn game)

Cú đứng bên trái màn chơi, phản ứng theo đúng kết quả bé chọn — 3
trạng thái giống hệt cơ chế đã làm cho Bill ở Bước 12 (chờ đợi/vui/
buồn), chỉ đổi từ "bạn nhỏ" sang "chú cú". Ảnh **chờ đợi** (`owl-idle.png`)
cũng dùng luôn làm icon thu nhỏ ở ô chọn game "How Many?" trên Trang
chủ — không cần tạo thêm ảnh riêng cho icon.

#### Khung phong cách (dán trước, dùng chung cho cả 3 trạng thái)

```
Cute chibi-style baby owl character illustration for a children's
mobile learning game, flat vector cartoon art style with soft
cel-shading and gentle gradient highlights, oversized round head with a
much smaller compact plump round body (chibi/baby proportions),
extremely large glossy round eyes with a bright white catchlight
sparkle, small rounded beak, small round wing-tufts instead of arms,
tiny feet, wearing a small round pair of scholarly glasses and a
miniature graduation cap or mortarboard tilted slightly to one side (to
look "wise/studious"), soft warm brown and cream feather coloring with
a lighter cream chest, smooth rounded shapes with no sharp edges, thin
clean dark outline around the whole character, saturated warm and
cheerful color palette, simple relaxed standing pose facing slightly to
the side, centered on a plain solid white (#FFFFFF) background, no
ground shadow, no scenery, no other characters, no text, no watermark,
no logo, square 1:1 composition, character fills about 75-85% of the
frame.
Avoid: realistic or photographic proportions, photographic texture,
scary or fierce owl look, background scenery, multiple characters in
frame, cropped body parts, text or watermark.
```

#### Prompt riêng: Cú chờ đợi (ảnh mặc định — cũng dùng làm icon Trang chủ)

```
The owl standing calmly in a relaxed neutral pose, both wing-tufts
resting at its sides, head tilted slightly to one side as if curiously
listening, a soft closed-beak content expression, calm patient and
attentive look — like a teacher waiting for an answer.
```

Lưu thành `owl-idle.png`.

#### Prompt riêng: Cú vui (bé trả lời đúng)

```
The owl standing with both wing-tufts raised slightly up and open, big
bright sparkling eyes, the graduation cap tilted a touch more from
excitement, a cheerful open-beak happy expression, rosy cheek blush
marks, as if proudly cheering.
```

Lưu thành `owl-happy.png`.

#### Prompt riêng: Cú buồn (bé trả lời sai)

```
The owl standing with wing-tufts drooping slightly and held together in
front, big sparkling eyes now looking slightly downcast with a small
furrowed brow, the glasses slipped a touch down the beak, a gentle
disappointed but still cute and sympathetic (not scary) expression.
```

Lưu thành `owl-sad.png`.

Lưu cả 3 ảnh vào `assets/_raw_incoming/` với đúng 3 tên trên, gửi qua
Git — tôi sẽ xoá nền + tối ưu + lưu vào `assets/characters/`.

**✅ Đã có ảnh thật** — `owl-idle.png`, `owl-happy.png`, `owl-sad.png`
đã xoá nền + lưu vào `assets/characters/`, đang chạy trong game.

### 16.3 — 4 nút bấm hình hoa ("nghe thử")

4 nút bấm để bé bấm nghe từng câu số lượng khác nhau — thay cho 4 khối
vuông màu hiện tại, đổi sang **hình 1 bông hoa** (không phải khung
vuông/tròn chứa hình hoa — chính bản thân bông hoa LÀ cái nút, nền
trong suốt để hiện đúng hình dạng hoa khi ghép vào game). Mỗi nút 1
loại hoa khác nhau để bé dễ phân biệt: hướng dương, cúc, hồng, tulip.

#### Khung phong cách (dán trước, dùng chung cho cả 4 loại hoa)

```
Cute simplified flat-vector illustration of a single cheerful cartoon
flower, designed as a tappable button icon for a children's game, soft
cel-shading with gentle gradient highlights, smooth rounded friendly
petal shapes with no sharp points, thin clean dark outline, bright
saturated cheerful colors, a short simple stem with 1-2 small rounded
leaves at the base, viewed straight-on/front-facing like a face-on
flower icon, centered on a plain solid white (#FFFFFF) background, no
shadow, no scenery, no other flowers, no text, no watermark, no logo,
square 1:1 composition, flower fills about 80-88% of the frame.
Avoid: realistic or photographic textures, 3D render look, side view or
angled view, clutter or multiple flowers, added face/eyes on the
flower, background scenery, text or watermark, cropped composition.
```

#### Prompt riêng cho từng loại hoa

```
Hoa hướng dương (Sunflower):
A cheerful sunflower with a plump round dark brown center disc and a
ring of bold rounded golden-yellow petals radiating evenly outward.

Hoa cúc (Daisy):
A cheerful daisy with a small round bright yellow center disc and a
ring of slim rounded pure white petals radiating evenly outward.

Hoa hồng (Rose):
A cheerful stylized rose viewed from the front, rounded overlapping
swirl of soft coral-pink petals forming a simple rosette shape (no
sharp thorny stem details, keep it soft and rounded).

Hoa tulip (Tulip):
A cheerful tulip viewed from the front, a simple rounded cup-shaped
bloom of 3-4 overlapping soft purple-violet petals with smooth rounded
tips.
```

Lưu 4 file: `sunflower.png`, `daisy.png`, `rose.png`, `tulip.png` —
gửi qua Git (`assets/_raw_incoming/`), tôi sẽ xoá nền + lưu vào
`assets/howmany/` (thư mục ảnh riêng cho các nút/UI của game này, khác
`assets/objects/` vốn dành cho từ vựng).

**✅ Đã có ảnh thật** — cả 4 file đã xoá nền + lưu vào `assets/howmany/`,
đang chạy trong game.

### 16.4 — Nút xác nhận hình bảng tính nhỏ

Sau khi bấm hoa nghe thử, bé bấm nút này để XÁC NHẬN lựa chọn — hình 1
bảng tính/máy tính nhỏ màu trắng, có ký hiệu 4 phép toán (+ − × ÷)
trang trí trên mặt (chỉ để trang trí cho đẹp/gợi liên tưởng "tính
toán", không cần đúng chức năng máy tính thật).

```
Cute simplified flat-vector illustration of a small white calculator/
tablet device, designed as a tappable button icon for a children's
game, soft cel-shading with gentle gradient highlights, smooth rounded
rectangular body with softly rounded corners, a small light blue-grey
rounded rectangle screen area near the top, below it four large
soft rounded colorful buttons arranged in a small row or grid showing
simple plus, minus, multiply, and divide symbols (+ − × ÷), one
symbol per button in a different cheerful color, thin clean dark
outline, bright cheerful color palette, viewed straight-on/front-
facing, centered on a plain solid white (#FFFFFF) background, no
shadow, no scenery, no other objects, no extra text, no watermark, no
logo, square 1:1 composition, device fills about 78-85% of the frame.
Avoid: realistic or photographic textures, 3D render look, side/angled
view, clutter, extra readable text beyond the 4 math symbols,
background scenery, text or watermark, cropped composition.
```

Lưu thành `calculator.png`, gửi qua Git (`assets/_raw_incoming/`), tôi
sẽ xoá nền + lưu vào `assets/howmany/`.

**✅ Đã có ảnh thật** — đã xoá nền + lưu vào `assets/howmany/calculator.png`,
đang chạy trong game.

<a id="buoc-17"></a>
## Bước 17 — 10 ảnh con số 1-10 dễ thương, thay cho đếm hình lặp lại

Đổi cách chơi game #4 "How Many?": thay vì hiển thị N hình đồ vật lặp
lại (vd 3 cái bình nước) để bé tự đếm, giờ hiển thị THẲNG 1 ảnh con số
(vd hình số "3") ở giữa khung — bé không cần đếm nữa, chỉ cần NHÌN mặt
số rồi bấm đúng nút hoa đọc đúng số đó. Cần 10 ảnh, mỗi ảnh 1 chữ số từ
1 đến 10 (số "10" viết bằng 2 ký tự "1" và "0" đứng cạnh nhau trong
cùng 1 khung ảnh, không tách 2 ảnh riêng).

### Khung phong cách (dán trước, dùng chung cho cả 10 số)

```
Cute simplified flat-vector illustration of a single bubbly numeral
digit, designed as a big friendly number card icon for a children's
learning game, soft cel-shading with gentle gradient highlights, thick
chunky rounded "bubble font" digit shape with soft rounded corners and
no sharp points, thin clean dark outline, a small soft highlight
sparkle in the upper-left of the digit, a tiny playful star or dot
decoration floating beside the digit (small, not overlapping or
obscuring the digit shape), centered on a plain solid white (#FFFFFF)
background, no shadow, no scenery, no other digits, no extra readable
text, no watermark, no logo, square 1:1 composition, the digit fills
about 75-85% of the frame height. No face, no eyes, no character
features on the digit itself — it is a number shape, not a character.
Avoid: thin or serif typography, realistic or photographic textures,
3D render look, added face/eyes on the digit, multiple digits other
than the one specified, background scenery, text or watermark, cropped
composition.
```

### Prompt riêng cho từng số (đổi màu để bé dễ phân biệt)

```
Số 1 (One):
The bubble-font numeral "1", bright coral-red color.

Số 2 (Two):
The bubble-font numeral "2", bright orange color.

Số 3 (Three):
The bubble-font numeral "3", bright golden-yellow color.

Số 4 (Four):
The bubble-font numeral "4", bright grass-green color.

Số 5 (Five):
The bubble-font numeral "5", bright teal color.

Số 6 (Six):
The bubble-font numeral "6", bright sky-blue color.

Số 7 (Seven):
The bubble-font numeral "7", bright periwinkle-purple color.

Số 8 (Eight):
The bubble-font numeral "8", bright pink-magenta color.

Số 9 (Nine):
The bubble-font numeral "9", bright warm brown color.

Số 10 (Ten):
The two bubble-font numerals "1" and "0" standing side by side as one
single tight group (same size, small gap between them, both part of
the same frame), bright golden color with tiny sparkle accents.
```

Lưu 10 file PNG theo đúng tên: `num-1.png`, `num-2.png`, ... `num-10.png`
— gửi qua Git theo đúng quy trình ở Bước 11 (thư mục
`assets/_raw_incoming/`), tôi sẽ xoá nền + lưu vào
`assets/howmany/numbers/` (thư mục con mới, tách riêng khỏi 4 ảnh hoa/
nút xác nhận đã có sẵn trong `assets/howmany/`).

**✅ Đã có ảnh thật** — cả 10 file đã xoá nền + lưu vào
`assets/howmany/numbers/`, đang chạy trong game (đã thay hẳn cụm N
hình đồ vật lặp lại cũ bằng 1 ảnh con số duy nhất, xem Vòng 30 trong
ROADMAP.md).
