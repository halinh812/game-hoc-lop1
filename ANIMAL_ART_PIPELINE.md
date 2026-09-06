# Quy trình tạo ảnh con vật (AI-ảnh-ngoài)

Quyết định Phase 0: nhân vật con vật sẽ tạo bằng công cụ AI ảnh bên ngoài
(không phải SVG tự code) — xem lý do trong `ROADMAP.md`. Tài liệu này là
quy trình lặp lại cho từng con vật mới.

**Đổi phong cách (sau phản hồi "chưa đẹp, chưa sinh động"):** bản đầu
dùng phong cách "semi-realistic" (giống ảnh chụp thật) — nhìn không khớp
với avatar hoạt hình dễ thương ở màn chọn hồ sơ, 2 phong cách chọi nhau.
Đổi hẳn sang phong cách **chibi/hoạt hình dễ thương** (mắt to long lanh,
tỉ lệ đầu to, tô màu vector mềm mại) theo đúng ảnh mẫu người dùng gửi —
đồng bộ với avatar, đồng bộ cả bộ. Con vật cũng không còn "đi lại" trong
game nữa (xem Bước 4) nên KHÔNG cần mô tả dáng đi/bước chân như trước —
chỉ cần 1 dáng đứng/ngồi đơn giản, thoải mái.

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

## Bước 2 — Gửi ảnh cho tôi

Tải ảnh về (PNG), gửi trực tiếp vào cuộc trò chuyện này.

## Bước 3 — Tôi xử lý (tự động)

1. Chạy `tools/remove_white_bg.py` (đã có sẵn trong repo, dùng kỹ thuật
   tô loang từ viền ảnh — không đục lỗ vào lông trắng bên trong con vật)
   để tách nền trắng → nền trong suốt
2. Tối ưu kích thước file cho web/mobile
3. Đặt tên theo đúng chuẩn trong `content-schema.json`
   (`assets/animals/tiger.png`)
4. Ghép vào bản demo "sân chơi" để bạn xem thử cảm giác chuyển động thật
   trong game

## Bước 4 — Chuyển động trong game (đã đổi lại sau nhiều vòng thử)

Đã thử qua 4 kiểu chuyển động khác nhau (chạy tự do, núp bụi cây, 4 hàng
đi ngang...) — đều bị chê "rối"/"không đẹp hơn". **Chốt cuối cùng: con vật
đứng yên tại chỗ (không di chuyển vị trí), chỉ có 1 hiệu ứng "lắc lư nhẹ
nhàng"** (CSS xoay qua lại vài độ, như đang thở) — mỗi ô lệch giờ 1 chút
để không đồng bộ tăm tắp trông máy móc. Đơn giản, không rối mắt, nhưng
vẫn có sức sống hơn hẳn ảnh đứng im 100%. Khi bấm đúng: ảnh phát video
(nếu có) tiếp tục lặp, kèm hiệu ứng nảy + hạt "ăn mừng" bắn ra + tiếng
chuông ting.

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
