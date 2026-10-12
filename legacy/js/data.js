'use strict';
/* =====================================================================
   DỮ LIỆU TĨNH — mọi con số cân bằng nằm ở đây để dễ chỉnh/sim.
   ===================================================================== */
const TS = n => `assets/ts/${n}.png`;
const DAY = 86400000, HOUR = 3600000;

/* ---------- Hàng hoá ---------- */
const GOODS = ['food','wood','ore','herb'];
const GOOD = {
  food:{n:'Lương thực',price:2,  icon:{img:TS('res_meat')}},
  wood:{n:'Gỗ',        price:3,  icon:{img:TS('res_wood')}},
  ore: {n:'Vàng thô',  price:6,  icon:{img:TS('res_gold')}},
  herb:{n:'Dược liệu', price:12, icon:{sheet:'items',c:4,r:19}},
};

/* ---------- Công trình sản xuất ---------- */
const BUILD = {
  farm:  {n:'Trang Trại',  good:'food',base:1.0,cost:30,  unlockDay:0, desc:'Chăn cừu, sản xuất lương thực'},
  lumber:{n:'Xưởng Gỗ',    good:'wood',base:0.8,cost:90,  unlockDay:0, desc:'Đốn gỗ cho thương hội'},
  mine:  {n:'Mỏ Vàng',     good:'ore', base:0.5,cost:250, unlockDay:1, desc:'Khai thác vàng thô'},
  garden:{n:'Tu Viện Dược',good:'herb',base:0.3,cost:700, unlockDay:2, desc:'Trồng và bào chế dược liệu'},
};
const UNLOCK_TXT = ['', 'Mỏ Vàng, Bến Cảng, Quán Trọ, Bảng Xếp Hạng, tuyến Cảng Biển, Đơn Hàng Thương Hội', 'Tu Viện Dược, Rương Trang Bị, Sổ Thương Hội, tuyến Thành Đô, Thám Hiểm (cho thẻ dự bị)', 'Mở Chi Nhánh (Prestige), tuyến Hành Trình Đêm, Tháp Thử Thách'];
const BKEYS = Object.keys(BUILD);
const MILESTONES = [10,25,50,100,200,400];       // mỗi mốc x2 sản lượng

/* ---------- Công trình phụ trợ (hạ tầng thành phố) ---------- */
const FAC = {
  market:   {n:'Chợ Trung Tâm',  cost:200,  g:1.55, max:50, unlockDay:0, desc:l=>`Auto-Trade bán ${Math.round(autoRate(l)*100)}% giá`},
  warehouse:{n:'Nhà Kho',        cost:150,  g:1.5,  max:50, unlockDay:0, desc:l=>`Sức chứa mỗi loại: ${fmt(capOf(l))}`},
  port:     {n:'Bến Cảng',       cost:1500, g:1.8,  max:12, unlockDay:1, desc:l=>`${1+Math.floor(l/4)} thương đoàn cùng lúc · +${l*4}% lãi`},
  tavern:   {n:'Quán Trọ',       cost:800,  g:1.7,  max:20, unlockDay:1, desc:l=>`+${l}h offline · +${l*3}% ngọc thụ động`},
};
const FKEYS = Object.keys(FAC);
const autoRate = l => Math.min(0.9, 0.55 + l*0.01);       // % giá bán tự động
const capOf    = l => Math.floor(400*Math.pow(1.45,l));    // sức chứa kho

/* ---------- Anh hùng (gacha) — sprite 32rogues (cột,hàng) ---------- */
const RN = ['N','R','SR','SSR'];
const RB = {N:6,R:14,SR:32,SSR:80};               // % buff gốc theo độ hiếm
const RCOL = {N:'#9aa0a6',R:'#4fa3ff',SR:'#b86bff',SSR:'#ffb83d'};
const JOBN = {farm:'Trang Trại',lumber:'Xưởng Gỗ',mine:'Mỏ Vàng',garden:'Tu Viện Dược',trade:'Thương Đoàn'};
const H = (id,n,r,c,rw,job,story,sh='rogues')=>({id,n,r,c,rw,job,story,sh});
const HEROES = [
  // N
  H(0,'Nông Dân Lúa','N',0,5,'farm','Gặt lúa từ lúc gà chưa gáy.'),
  H(1,'Nông Dân Liềm','N',1,5,'farm','Liềm sắc hơn lời hứa của thương nhân.'),
  H(2,'Nông Dân Chĩa','N',2,5,'farm','Chĩa ba là vũ khí và công cụ.'),
  H(3,'Thợ Đốt Than','N',0,6,'mine','Mặt đen nhưng tay sạch.'),
  H(4,'Dân Làng','N',1,6,'lumber','Ai cần việc gì cũng làm.'),
  H(5,'Bà Lão Hái Thuốc','N',3,6,'garden','Biết mọi loại cỏ trong rừng.'),
  H(6,'Ông Lão Buôn','N',4,6,'trade','Buôn từ thời cha ông.'),
  H(7,'Thợ Làm Bánh','N',3,5,'trade','Bánh mì nóng mở hàng đầu ngày.'),
  // R
  H(8,'Thợ Mỏ Lùn','R',0,0,'mine','Đào sâu hơn bản đồ cho phép.'),
  H(9,'Tinh Linh Rừng','R',1,0,'garden','Cây cối nghe lời cô.'),
  H(10,'Xạ Thủ Rừng','R',2,0,'lumber','Bảo vệ rừng, tiện thể chặt vài cây.'),
  H(11,'Đạo Chích','R',3,0,'trade','Biết giá trước cả người bán.'),
  H(12,'Chủ Tiệm','R',2,6,'trade','Nụ cười đáng giá ngàn vàng.'),
  H(13,'Học Giả','R',5,5,'garden','Ghi chép từng công thức.'),
  H(14,'Kiếm Sĩ','R',3,3,'trade','Hộ tống đoàn buôn.'),
  H(15,'Tu Sĩ','R',0,2,'garden','Cầu nguyện cho mùa màng.'),
  // SR
  H(16,'Thợ Rèn','SR',4,5,'mine','Búa của ông đập vỡ cả núi.'),
  H(17,'Đạo Sĩ Rừng','SR',2,4,'garden','Thì thầm với bụi dược thảo.'),
  H(18,'Mục Sư','SR',1,2,'garden','Ban phước cho vụ mùa.'),
  H(19,'Man Tộc','SR',0,3,'lumber','Một nhát rìu, một cây sồi.'),
  H(20,'Nữ Man Tộc','SR',5,3,'farm','Cày ruộng nhanh nhất vùng.'),
  H(21,'Hiệp Sĩ','SR',0,1,'trade','Uy tín bảo chứng cho đoàn buôn.'),
  H(22,'Kiếm Thuật Gia','SR',4,3,'trade','Không cướp nào dám lại gần.'),
  H(23,'Pháp Sư Lùn','SR',4,4,'mine','Bùa đá, nổ quặng.'),
  // SSR
  H(24,'Nữ Pháp Sư','SSR',0,4,'farm','Mưa đến đúng giờ cô gọi.'),
  H(25,'Đại Pháp Sư','SSR',1,4,'trade','Tính toán lợi nhuận bằng phép thuật.'),
  H(26,'Hiền Giả Sa Mạc','SSR',3,4,'garden','Dược liệu quý từ cát nóng.'),
  H(27,'Phù Thủy Hầm Mỏ','SSR',5,4,'mine','Gọi vàng từ lòng đất.'),
  H(28,'Hiệp Sĩ Khiên','SSR',4,1,'lumber','Rừng này đã có người canh.'),
  H(29,'Nữ Kỵ Sĩ Vương Quốc','SSR',2,1,'trade','Đoàn buôn đi đâu, vinh quang theo đó.'),
  // ----- mở rộng lên 100 (id 30–99): người, thú, quái/linh -----
  H(30,'Thổ Phỉ','N',4,0,'trade','Cướp đường chán, quay sang buôn.','rogues'),
  H(31,'Chiến Binh','SR',1,1,'lumber','Vung kiếm như người ta vung rìu.','rogues'),
  H(32,'Nữ Kỵ Sĩ Trẻ','SR',3,1,'trade','Tháo mũ để khách thấy nụ cười.','rogues'),
  H(33,'Nữ Thánh Chiến','SSR',2,2,'farm','Ban phước cho mọi mùa gặt.','rogues'),
  H(34,'Chiến Mục','SR',3,2,'garden','Dùng búa chữa lành, ai cũng sợ.','rogues'),
  H(35,'Thánh Kỵ Sĩ','SSR',4,2,'mine','Khiên sáng vững hơn đá núi.','rogues'),
  H(36,'Thiền Sư','SR',5,2,'garden','Tĩnh tâm, dược thảo tự mọc.','rogues'),
  H(37,'Đại Trưởng Lão','SSR',6,2,'garden','Sống lâu nhất, biết mọi bí mật.','rogues'),
  H(38,'Man Tộc Tuyết','R',1,3,'lumber','Chặt cây giữa trời tuyết.','rogues'),
  H(39,'Nữ Man Tộc Tuyết','R',2,3,'mine','Đào quặng bằng tay không.','rogues'),
  H(40,'Sát Thủ Bóng Đêm','R',5,0,'trade','Giao hàng nhanh, không để lại dấu.','rogues'),
  H(41,'Ma Y Nhân','R',6,0,'garden','Áo choàng kín, thuốc quý hiếm.','rogues'),
  H(42,'Sư Tử Vương','SSR',6,3,'lumber','Tiếng gầm làm đổ cả khu rừng.','animals'),
  H(43,'Gấu Xám','SR',0,0,'mine','Cào đá như cào đất.','animals'),
  H(44,'Gấu Bắc Cực','SR',2,0,'mine','Lì lợm như băng giá.','animals'),
  H(45,'Khỉ Đột','SR',1,1,'lumber','Ôm cây nhổ tận gốc.','animals'),
  H(46,'Sói Xám','SR',6,4,'trade','Dẫn đường đoàn buôn qua đêm.','animals'),
  H(47,'Gấu Trúc','R',3,0,'garden','Nhai trúc, ủ thuốc.','animals'),
  H(48,'Đười Ươi','R',2,1,'farm','Hái quả nhanh nhất vùng.','animals'),
  H(49,'Báo Săn','R',3,3,'trade','Chạy giao hàng như gió.','animals'),
  H(50,'Sư Tử Cái','R',7,3,'lumber','Săn mồi và canh rừng.','animals'),
  H(51,'Lợn Rừng','R',7,9,'farm','Ủi đất thay cày.','animals'),
  H(52,'Chiến Mã','R',1,9,'trade','Kéo xe hàng không biết mệt.','animals'),
  H(53,'Lạc Đà','R',0,10,'trade','Băng sa mạc chở nặng.','animals'),
  H(54,'Bò Tây Tạng','R',3,10,'farm','Cày ruộng trên núi cao.','animals'),
  H(55,'Kangaroo','R',0,12,'lumber','Đá cây ngã, nhảy xa.','animals'),
  H(56,'Gấu Đen','N',1,0,'mine','Hay ngủ, hay đào.','animals'),
  H(57,'Tinh Tinh','N',0,1,'farm','Biết dùng cuốc.','animals'),
  H(58,'Khỉ Mặt Quỷ','N',2,2,'lumber','Mặt dữ, bụng hiền.','animals'),
  H(59,'Mèo Nhà','N',0,3,'garden','Canh kho, bắt chuột.','animals'),
  H(60,'Mèo Rừng','N',4,3,'lumber','Leo cây giỏi.','animals'),
  H(61,'Cáo Đỏ','N',3,4,'trade','Mặc cả khéo lắm.','animals'),
  H(62,'Linh Cẩu','N',2,4,'mine','Cười vang trong hầm mỏ.','animals'),
  H(63,'Chó Săn','N',0,4,'farm','Giữ đàn cừu.','animals'),
  H(64,'Chuột Lang Nước','N',0,5,'garden','Hiền, thích tắm bùn.','animals'),
  H(65,'Lừa','N',2,9,'trade','Thồ hàng cần mẫn.','animals'),
  H(66,'Lạc Đà Không Bướu','N',5,9,'garden','Nhai cỏ thuốc suốt ngày.','animals'),
  H(67,'Bò Sữa','N',0,9,'farm','Cho sữa đều đặn.','animals'),
  H(68,'Gà Trống','N',1,14,'farm','Gáy báo mùa gặt.','animals'),
  H(69,'Chim Cánh Cụt','N',0,13,'mine','Lạc đường tới tận mỏ.','animals'),
  H(70,'Rùa Núi','N',3,8,'mine','Chậm mà chắc.','animals'),
  H(71,'Dê Núi','N',1,15,'lumber','Leo vách đá lấy gỗ.','animals'),
  H(72,'Cừu Đực','N',3,15,'farm','Húc gãy hàng rào.','animals'),
  H(73,'Thiên Thần','SSR',0,11,'garden','Cánh sáng ban phước dược thảo.','monsters'),
  H(74,'Nữ Thần Rừng','SSR',0,7,'farm','Cây trái nở theo tiếng hát.','monsters'),
  H(75,'Nàng Naga','SR',4,7,'trade','Mắt sáng như đá quý.','monsters'),
  H(76,'Nhân Mã','SR',3,7,'lumber','Phi nước đại, vung rìu.','monsters'),
  H(77,'Wendigo','SR',1,7,'mine','Thức dậy từ hang tối.','monsters'),
  H(78,'Tử Thần','SR',1,5,'mine','Gặt vàng thay lúa.','monsters'),
  H(79,'Sư Thân Quỷ','SR',3,6,'lumber','Móng sắc, đuôi độc.','monsters'),
  H(80,'Linh Hồn Rừng','SR',5,7,'garden','Thì thầm với cỏ cây.','monsters'),
  H(81,'Satyr','R',6,7,'trade','Thổi sáo mở hàng.','monsters'),
  H(82,'Nữ Điểu','R',8,7,'garden','Mang hạt giống từ xa.','monsters'),
  H(83,'Thằn Lằn Người','R',0,8,'mine','Quen hơi nóng hầm mỏ.','monsters'),
  H(84,'Banshee','R',0,5,'garden','Hát ru cây thuốc.','monsters'),
  H(85,'Phù Thủy Già','R',4,5,'trade','Bán bùa linh nghiệm.','monsters'),
  H(86,'Orc Pháp Sư','R',1,0,'mine','Nổ đá bằng phép.','monsters'),
  H(87,'Basilisk','R',4,8,'lumber','Hóa đá cả cây to.','monsters'),
  H(88,'Gà Thằn Lằn','R',3,8,'farm','Đẻ trứng quý.','monsters'),
  H(89,'Goblin Dũng Mãnh','R',7,0,'lumber','Nhỏ con nhưng khỏe.','monsters'),
  H(90,'Kobold Nhí','N',0,9,'trade','Chạy việc vặt.','monsters'),
  H(91,'Kobold','N',1,9,'farm','Đào khoai giỏi.','monsters'),
  H(92,'Nấm Nhí','N',0,10,'garden','Mọc sau mưa.','monsters'),
  H(93,'Nấm Lớn','N',1,10,'garden','Che mưa cho dược thảo.','monsters'),
  H(94,'Slime Lớn','N',1,2,'farm','Làm phân bón miễn phí.','monsters'),
  H(95,'Xạ Thủ Xương','N',1,4,'lumber','Bắn tên thay đốn cây.','monsters'),
  H(96,'Tiểu Quỷ','N',1,11,'trade','Mặc cả bằng đuôi.','monsters'),
  H(97,'Nhện Khổng Lồ','N',8,6,'mine','Giăng tơ trong hầm.','monsters'),
  H(98,'Tu Sĩ Vô Diện','N',0,3,'garden','Cầu nguyện không lời.','monsters'),
  H(99,'Rết Khổng Lồ','N',0,6,'mine','Len lỏi mọi khe đá.','monsters'),
];
const SSR_IDS = HEROES.filter(h=>h.r==='SSR').map(h=>h.id);

/* ---------- Trang bị (rương gacha) — sprite items.png (cột,hàng) ---------- */
const GSLOT = {weapon:'Vũ khí',armor:'Giáp',charm:'Trang sức',potion:'Thuốc'};
const GDESC = {weapon:'Sản lượng toàn làng',armor:'Lợi nhuận thương đoàn',charm:'Ngọc thụ động & offline',potion:'Giá bán hàng hoá'};
const G = (id,n,slot,r,c,rw)=>({id,n,slot,r,c,rw});
const GEAR = [
  G(0,'Dao Găm','weapon','N',0,0),G(1,'Trường Kiếm','weapon','R',3,0),G(2,'Kiếm Pha Lê','weapon','SR',8,0),G(3,'Kiếm Hoả Diệm','weapon','SSR',10,0),
  G(4,'Áo Da','armor','N',0,12),G(5,'Áo Cam','armor','R',1,12),G(6,'Giáp Xích','armor','SR',4,12),G(7,'Giáp Bạc','armor','SSR',5,12),
  G(8,'Nhẫn Đồng','charm','N',0,17),G(9,'Dây Chuyền','charm','R',2,16),G(10,'Bùa Lam','charm','SR',4,16),G(11,'Thập Tự Ankh','charm','SSR',6,16),
  G(12,'Thuốc Nhỏ','potion','N',0,19),G(13,'Thuốc Đỏ','potion','R',1,19),G(14,'Thuốc Lục','potion','SR',3,19),G(15,'Tiên Dược','potion','SSR',4,20),
];
const GB = {N:3,R:8,SR:20,SSR:50};

/* ---------- Thương đoàn ---------- */
const ROUTES = [
  {n:'Làng Lân Cận', time:60,    mult:1.25, minPct:.15, unlockDay:0, gem:[0,0]},
  {n:'Cảng Biển',    time:900,   mult:1.8,  minPct:.20, unlockDay:1, gem:[6,.20]},
  {n:'Thành Đô',     time:7200,  mult:2.8,  minPct:.25, unlockDay:2, gem:[15,.30]},
  {n:'Hành Trình Đêm',time:28800,mult:5.5,  minPct:.30, unlockDay:3, gem:[45,.50]}, // 8h — lý do để quay lại sáng hôm sau
];

/* ---------- Gacha ---------- */
const COST = {pull:160, pull10:1600, chest:3000, chest10:27000};
const PITY = {char:{soft:59,hard:80,ssr:1.6,sr:12,r:36,srGuar:10}, chest:{soft:39,hard:60,ssr:1.5,sr:10,r:34,srGuar:10}};

/* ---------- Giờ Vàng (thói quen quay lại theo khung giờ) ---------- */
const GOLDEN = [{h:12,m:0,len:60},{h:20,m:0,len:120}];      // giờ địa phương, phút
const GOLDEN_PRICE = 1.5;

/* ---------- Nhiệm vụ ngày ---------- */
const DAILY = [
  {id:'login', n:'Điểm danh',                    goal:()=>1,                get:s=>1,                 ap:15, gems:15},
  {id:'gold',  n:'Kiếm vàng',                    goal:s=>Math.floor(1500*Math.pow(1.35,s.guildLv-1)), get:s=>s.daily.stat.gold,   ap:20, gems:20},
  {id:'ups',   n:'Nâng cấp công trình',          goal:s=>5+Math.floor(s.guildLv/3),               get:s=>s.daily.stat.ups,    ap:10, gems:20},
  {id:'cars',  n:'Gửi thương đoàn',              goal:()=>2,                get:s=>s.daily.stat.cars, ap:10, gems:20},
  {id:'pulls', n:'Chiêu mộ hoặc mở hòm',         goal:()=>3,                get:s=>s.daily.stat.pulls,ap:10, gems:25},
  {id:'sell',  n:'Giao hàng thủ công',           goal:()=>2,                get:s=>s.daily.stat.sell, ap:5, gems:15},
  {id:'wins',  n:'Thắng Đấu Thẻ',                goal:()=>2,                get:s=>s.daily.stat.wins||0, ap:15, gems:20},
  {id:'orders',n:'Giao đơn hàng',               goal:()=>1,                get:s=>s.daily.stat.orders||0, ap:10, gems:20},
  {id:'exp',   n:'Hoàn thành thám hiểm',         goal:()=>1,                get:s=>s.daily.stat.exp||0,    ap:10, gems:20},
];
const AP_CHESTS = [
  {ap:20, r:{gems:40}},{ap:40,r:{gems:40,gold:'x'}},{ap:60,r:{tickets:1}},{ap:80,r:{gems:60}},{ap:100,r:{tickets:1,gems:60}},
];

/* ---------- Đăng nhập 7 ngày (lặp lại) ---------- */
const LOGIN = [
  {gems:300, tickets:1},{gems:300, gold:'x'},{gems:400, tickets:3},{gems:500, gold:'x'},
  {gems:500, tickets:3},{gems:700, gold:'x'},{gems:1000, tickets:3, ssrPick:1},
];

/* ---------- Hành trình 7 ngày: mục tiêu theo ngày tài khoản ---------- */
const JOURNEY = [
  {day:0, title:'Ngày 1 — Khởi nghiệp', teaser:'Đạt Cấp Thương Hội 3 để mở Mỏ Vàng, Bến Cảng, Quán Trọ và Bảng Xếp Hạng!', goals:[
    {id:'j0a',n:'Nâng Trang Trại lên Lv 5',      chk:s=>s.lv.farm>=5,           rew:{gems:140}},
    {id:'j0b',n:'Nâng Xưởng Gỗ lên Lv 3',        chk:s=>s.lv.lumber>=3,         rew:{gems:100}},
    {id:'j0c',n:'Chiêu mộ 10 lần (tân thủ)',      chk:s=>s.stats.pulls>=10,      rew:{gems:210}},
    {id:'j0d',n:'Giao 1 thương đoàn về',          chk:s=>s.stats.cars>=1,        rew:{gems:100,tickets:1}},
    {id:'j0f',n:'Thắng 1 trận Đấu Thẻ',           chk:s=>s.battle.cleared>=1,   rew:{gems:100,tickets:1}},
    {id:'j0e',n:'Phân công 1 anh hùng',           chk:s=>Object.keys(s.assign).length>=1, rew:{gems:140}},
  ]},
  {day:1, title:'Ngày 2 — Mở rộng', teaser:'Đạt Cấp 5: Tu Viện Dược, Rương trang bị, Sổ Thương Hội!', goals:[
    {id:'j1a',n:'Xây Mỏ Vàng',                    chk:s=>s.lv.mine>=1,           rew:{gems:140}},
    {id:'j1b',n:'Chợ Trung Tâm Lv 5',             chk:s=>s.fac.market>=5,        rew:{gems:140}},
    {id:'j1c',n:'Gửi thương đoàn Cảng Biển',      chk:s=>s.stats.routeUse[1]>=1, rew:{gems:180,tickets:1}},
    {id:'j1e',n:'Giao 1 đơn hàng Thương Hội',     chk:s=>s.stats.orders>=1,     rew:{gems:120}},
    {id:'j1d',n:'Sưu tập 6 anh hùng',             chk:s=>Object.keys(s.own).length>=6, rew:{gems:210}},
  ]},
  {day:2, title:'Ngày 3 — Chuyên môn', teaser:'Đạt Cấp 8: Mở Chi Nhánh (Prestige) với bội số vĩnh viễn!', goals:[
    {id:'j2a',n:'Xây Tu Viện Dược',               chk:s=>s.lv.garden>=1,         rew:{gems:180}},
    {id:'j2b',n:'Sở hữu 1 trang bị',              chk:s=>Object.keys(s.gear).length>=1,  rew:{gems:140,tickets:1}},
    {id:'j2c',n:'Đạt Cấp Thương Hội 6',           chk:s=>s.guildLv>=6,           rew:{gems:210}},
    {id:'j2f',n:'Nhận thưởng Treo Máy 1 lần',     chk:s=>s.afk.claims>=1,       rew:{gems:100,tickets:1}},
    {id:'j2e',n:'Qua màn 5 Đấu Thẻ (Boss)',       chk:s=>s.battle.cleared>=5,   rew:{gems:150,tickets:1}},
    {id:'j2d',n:'Có anh hùng SR trở lên',         chk:s=>Object.keys(s.own).some(i=>RN.indexOf(HEROES[i].r)>=2), rew:{gems:210,tickets:2}},
  ]},
  {day:3, title:'Ngày 4 — Chi nhánh', teaser:'Ngày mai: Thương đoàn tuyến Hành Trình Đêm 8h x5.5 lãi!', goals:[
    {id:'j3a',n:'Tổng cấp công trình 60',         chk:s=>BKEYS.reduce((a,k)=>a+s.lv[k],0)>=60, rew:{gems:210}},
    {id:'j3b',n:'Thực hiện Mở Chi Nhánh lần 1',   chk:s=>s.prestige.count>=1,    rew:{gems:350,tickets:2}},
    {id:'j3d',n:'Hoàn thành 1 thám hiểm',          chk:s=>s.stats.exp>=1,        rew:{gems:150}},
    {id:'j3c',n:'Gửi thương đoàn Thành Đô',       chk:s=>s.stats.routeUse[2]>=1, rew:{gems:210}},
  ]},
  {day:4, title:'Ngày 5 — Đua top', teaser:'Ngày mai: chốt tuần — nhận thưởng Bảng Xếp Hạng!', goals:[
    {id:'j4a',n:'Vào Top 10 Bảng Xếp Hạng tuần',  chk:s=>s.rank>0&&s.rank<=10,   rew:{gems:280,tickets:2}},
    {id:'j4b',n:'Có 3 anh hùng SR+ trở lên',      chk:s=>Object.keys(s.own).filter(i=>RN.indexOf(HEROES[i].r)>=2).length>=3, rew:{gems:280}},
    {id:'j4d',n:'Qua màn 10 Đấu Thẻ',             chk:s=>s.battle.cleared>=10,  rew:{gems:200,tickets:1}},
    {id:'j4e',n:'Leo Tháp Thử Thách tầng 3',      chk:s=>s.tower.floor>=3,      rew:{gems:200,tickets:1}},
    {id:'j4c',n:'Nâng 1 anh hùng lên Lv 10',      chk:s=>Object.values(s.own).some(o=>o.lv>=10), rew:{gems:210}},
  ]},
  {day:5, title:'Ngày 6 — Hoàn thiện', teaser:'Ngày mai: Vé SSR TỰ CHỌN ở quà đăng nhập ngày 7!', goals:[
    {id:'j5a',n:'Sưu tập 12 anh hùng',            chk:s=>Object.keys(s.own).length>=12, rew:{gems:350}},
    {id:'j5b',n:'Gửi Hành Trình Đêm',             chk:s=>s.stats.routeUse[3]>=1, rew:{gems:350,tickets:2}},
    {id:'j5c',n:'Đủ 4 ô trang bị',                chk:s=>['weapon','armor','charm','potion'].every(sl=>GEAR.some(g=>g.slot===sl&&s.gear[g.id])), rew:{gems:280}},
  ]},
  {day:6, title:'Ngày 7 — Huyền thoại', teaser:'Tuần mới: sự kiện & thương hội đối thủ mới!', goals:[
    {id:'j6a',n:'Sở hữu 1 anh hùng SSR',          chk:s=>Object.keys(s.own).some(i=>HEROES[i].r==='SSR'), rew:{gems:560,ssrPick:1}},
    {id:'j6b',n:'Cấp Thương Hội 10',              chk:s=>s.guildLv>=10,          rew:{gems:420,tickets:3}},
    {id:'j6d',n:'Qua màn 15 Đấu Thẻ',             chk:s=>s.battle.cleared>=15,  rew:{gems:300,tickets:2}},
    {id:'j6c',n:'Đăng nhập đủ 7 ngày',            chk:s=>s.loginDays>=7,         rew:{gems:490,tickets:3}},
  ]},
];

/* ---------- Thành tựu (dài hạn) ---------- */
const ACH = [
  {id:'a_gold',  n:'Phú ông',        get:s=>s.stats.gold,   tiers:[1e4,1e5,1e6,1e7,1e8,1e9,1e10,1e12], gem:[25,50,75,125,200,300,450,750]},
  {id:'a_ups',   n:'Nhà xây dựng',   get:s=>s.stats.ups,    tiers:[20,100,300,1000,3000],             gem:[25,50,100,200,400]},
  {id:'a_pulls', n:'Nhà tuyển mộ',   get:s=>s.stats.pulls,  tiers:[10,50,100,300,1000],               gem:[50,75,125,250,500]},
  {id:'a_cars',  n:'Đoàn trưởng',    get:s=>s.stats.cars,   tiers:[5,25,100,300,1000],                gem:[25,50,100,200,400]},
  {id:'a_hero',  n:'Sưu tầm',        get:s=>Object.keys(s.own).length, tiers:[5,10,15,20,30,40,50,60,80,100], gem:[40,60,100,150,250,250,400,500,800,1500]},
  {id:'a_pres',  n:'Đa chi nhánh',   get:s=>s.prestige.count,tiers:[1,3,5,10,25],                     gem:[100,150,250,400,750]},
  {id:'a_win',  n:'Đấu sĩ',         get:s=>s.battle.wins,  tiers:[1,10,50,150,500],                gem:[30,50,100,200,400]},
  {id:'a_login', n:'Gắn bó',         get:s=>s.loginDays,    tiers:[3,7,14,30,60,100],                 gem:[50,150,250,500,1000,1500]},
];

/* ---------- Sổ Thương Hội (mùa 28 ngày, 30 bậc, miễn phí) ---------- */
const PASS_XP = 40;       // XP / bậc (XP = điểm hoạt động ngày)
const PASS = Array.from({length:30},(_,i)=>{
  const t=i+1;
  if(t===30) return {ssrPick:1,gems:500};
  if(t===20) return {ssrPick:0,tickets:5,gems:300};
  if(t===10) return {tickets:3,gems:300};
  if(t%5===0)return {tickets:2,gems:100};
  return t%2?{gems:60+t*3}:{gold:'x'};
});

/* ---------- Đối thủ giả lập (bảng xếp hạng tuần) ---------- */
const RIVALS = ['Hắc Long Hội','Ngân Hồ Thương','Thiên Phú Đường','Bạch Lộc','Kim Tước','Vạn Lợi','Tử Vân Các','Long Môn','Phượng Hoàng','Thái Bình','Đại Cát','Hải Đăng','Sơn Hà','Nhất Phẩm','Thanh Liên','Hoàng Kim','Tứ Hải','Cửu Châu','Bảo Châu','Vân Du'];
const RANK_REW = [{max:1,gems:800,tickets:3},{max:3,gems:500,tickets:2},{max:10,gems:300,tickets:1},{max:20,gems:150},{max:999,gems:60}];

/* ---------- Cấp Thương Hội ---------- */
const guildXpNeed = l => Math.floor(100*Math.pow(1.22,l-1));

/* ---------- Tướng lĩnh (nhân vật chính) ---------- */
// anim: {src, fw, fh, cols, n, fps}; thêm tướng mới = thêm 1 mục + file sprite
const GENERALS = [
  { id: 'lan', n: 'Nguyệt Lan', title: 'Nữ Tướng Sừng Bạc', credit: 'Platformer Character Pack — Merakintsugi',
    idle: { src: 'assets/gen/lan_idle.png', fw: 46, fh: 55, cols: 10, n: 10, fps: 8 },
    walk: { src: 'assets/gen/lan_walk.png', fw: 45, fh: 58, cols: 4, n: 24, fps: 14 },
    ult: 'Hiệu Lệnh Toàn Quân', story: 'Chỉ huy đoàn thương đội từ ngày đầu lập hội.' },
];
const generalBonus = lv => ({ atk: 0.05 + 0.01 * lv, hp: 0.05 + 0.01 * lv, ult: 1 + 0.03 * lv });
