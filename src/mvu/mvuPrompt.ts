/**
 * Prompt hướng dẫn AI cập nhật Bảng Trạng Thái (mục 5.4b) — entry [mvu_update],
 * luôn có mặt mọi lượt (constant). Đi CẶP với khối render state (5.7.3):
 * prompt này dạy AI CÁCH GHI; khối render dạy AI ĐỌC GÌ.
 * Danh sách field khớp StatDataSchema hiện tại — cập nhật khi schema phình (10-17).
 */
export const MVU_UPDATE_PROMPT = `# QUY TẮC CẬP NHẬT BẢNG TRẠNG THÁI

Sau MỖI lượt kể, ngươi PHẢI xuất một khối JSON cập nhật trạng thái, đặt ở CUỐI phản hồi,
phản ánh chính xác những gì vừa xảy ra TRONG LỜI KỂ của ngươi. Người chơi sẽ không thấy khối
này (hệ thống tự ẩn) — nó chỉ để cập nhật cỗ máy trò chơi.

## ĐỊNH DẠNG

Khối phải là JSON hợp lệ, bọc trong thẻ, theo đúng mẫu:

<UpdateVariable>
{
  "mvu_update": [
    { "op": "...", "path": "...", "value": ... }
  ]
}
</UpdateVariable>

Nếu lượt này KHÔNG có gì thay đổi (chỉ đối thoại xã giao), trả mảng rỗng:
<UpdateVariable>
{ "mvu_update": [] }
</UpdateVariable>

## NĂM LOẠI THAO TÁC (op)

1. "replace" — ĐẶT một giá trị (ghi đè, hoặc TẠO MỚI nếu chưa có).
   Dùng cho: đổi vị trí, đổi chức vụ, đặt hảo cảm về một mốc cụ thể, THÊM NPC/vật phẩm mới.
   { "op": "replace", "path": "stat_data.Thế Giới.Vị Trí", "value": "King's Landing" }

2. "delta" — CỘNG THÊM/BỚT vào một số (dùng số âm để trừ).
   Dùng cho: HP giảm khi bị thương, Vàng tăng khi nhận thưởng, hảo cảm tăng/giảm dần.
   { "op": "delta", "path": "stat_data.Chỉ Số Sinh Tồn.HP", "value": -15 }
   { "op": "delta", "path": "stat_data.Mối Quan Hệ.NPC Chính.Tyrion Lannister.Độ Hảo Cảm", "value": 5 }

3. "insert" — THÊM một phần tử vào CUỐI một danh sách (mảng).
   Dùng cho: thêm ký ức mới cho NPC, thêm lời hứa, thêm nét tính cách.
   { "op": "insert", "path": "stat_data.Mối Quan Hệ.NPC Chính.Tyrion Lannister.Ký Ức",
     "value": { "Turn": 42, "Sự Việc": "Ngươi che chở hắn trước lời buộc tội của Cersei",
                "Cảm Xúc": "Biết Ơn", "Trọng Số": 70 } }

4. "remove" — XOÁ một field/phần tử.
   Dùng cho: dùng hết vật phẩm, một NPC rời khỏi nhóm.
   { "op": "remove", "path": "stat_data.Túi Đồ.Bình thuốc chữa thương" }

5. "move" — CHUYỂN giá trị từ chỗ này sang chỗ khác.
   Dùng cho: NPC chuyển từ nhóm này sang nhóm khác (hiếm dùng).
   { "op": "move", "from": "stat_data.A", "path": "stat_data.B" }

## CÁCH VIẾT path

- Luôn bắt đầu bằng "stat_data."
- Nối các cấp bằng dấu chấm, dùng ĐÚNG tên field tiếng Việt như trong bảng trạng thái.
- Các nhánh chính: Thông Tin Nhân Vật (Họ Tên/Nhà/Cấp Độ/Kinh Nghiệm/Vàng) ·
  Chỉ Số Sinh Tồn (HP/Thể Lực/Pháp Lực) · Chỉ Số Cốt Lõi (Sức Mạnh/Nhanh Nhẹn/Thể Chất/
  Trí Tuệ/Tinh Tường/Uy Tín) · Thiên Phú · Kỹ Năng · Trang Bị Đang Mặc · Túi Đồ ·
  Mối Quan Hệ (NPC Chính / Thành Viên Gia Tộc) · Thái Độ Các Nhà ·
  Thế Giới (Vị Trí/Năm/Ngày/Mùa/Thời Tiết) · Chế Độ Hiện Tại.
- Với NPC/vật phẩm: path đi qua tên riêng, ví dụ:
    stat_data.Mối Quan Hệ.NPC Chính.<Tên NPC>.Độ Hảo Cảm
    stat_data.Túi Đồ.<Tên vật phẩm>.Số Lượng
- Lãnh địa (nếu ngươi quản lý): stat_data.Lãnh Địa.<regionId>.Dân Số / .Trung Thành
  (số dân, lòng dân). ĐỪNG tự chỉnh Tài Nguyên/Công Trình — cỗ máy giữ số xây dựng/thu chi.
- Triều đình (13): stat_data.Triều Đình.Có Liên Quan (đặt true khi nhân vật dính líu triều chính) ·
  Triều Đình.Quyền Bổ Nhiệm (true nếu nhân vật có quyền bổ nhiệm trực tiếp — vua/lãnh chúa cai trị) ·
  Triều Đình.Tiểu Hội Đồng.<Chức>.Người Giữ Chức (tên NPC khi lời kể có bổ nhiệm; các chức:
  Bàn Tay Nhà Vua, Đại Chưởng Ngân Khố, Đại Chưởng Ấn, Đô Đốc Hạm Đội, Đại Điệp Viên, Học Sĩ Trưởng,
  Tổng Chỉ Huy Ngự Lâm Quân). Cỗ máy tự tính "Năng Lực" ghế từ NPC — ngươi chỉ ghi Người Giữ Chức.
- Hôn nhân & kế vị (13.4): thêm/bớt Thành Viên Gia Tộc (con cái, anh em) qua
  stat_data.Mối Quan Hệ.Thành Viên Gia Tộc.<Tên> (kèm "Tuổi", "Giới Tính":"Nam"/"Nữ", "Còn Sống").
  Đặt luật kế vị qua stat_data.Gia Tộc Học.Luật Kế Vị (Trưởng Nam / Trưởng Tử Bất Kể Giới (Dorne) /
  Bầu Chọn (Sắt) / Chỉ Định). Cỗ máy TỰ suy Thứ Tự Kế Vị + Người Thừa Kế — đừng tự xếp.
  Khi có nhà đến cầu hôn, ghi 1 hôn ước vào stat_data.Gia Tộc Học.Hôn Ước Đang Thương Lượng.<id> =
  { "Đối Tượng": tên người, "Nhà Đối Tác": houseId, "Của Hồi Môn": số Vàng, "Chi Trả": "Ta Trả"|"Ta Nhận",
  "Lợi Ích Chính Trị": mô tả } — người chơi bấm Chấp nhận/Từ chối ở bảng Triều Đình.
- Mưu đồ (14): NỘI DUNG tin tình báo do NGƯƠI viết — khi điệp viên thu được tin (cỗ máy báo có tin
  mới trong trạng thái), ghi tin cụ thể hợp bối cảnh vào stat_data.Tình Báo.Tin Tình Báo Đã Biết.<chủ đề>
  = "nội dung bí mật". Đừng tự chỉnh "Bị Nghi Ngờ"/"Độ Sâu Thâm Nhập"/"Tiến Độ"/"Độ Bại Lộ" (cỗ máy giữ số
  điệp viên + âm mưu). Khi lời kể có người bị bắt làm con tin, thêm vào stat_data.Tù Binh.<Tên> =
  { "Họ Tên", "Nhà", "Vai Trò", "Giá Chuộc", "Đối Xử":"Giam Lỏng" }.
- THÊM NPC MỚI: dùng "replace" với path tới tên NPC chưa có, value là object đầy đủ:
    { "op": "replace", "path": "stat_data.Mối Quan Hệ.NPC Chính.Ser Jorah Mormont",
      "value": { "Họ Tên": "Ser Jorah Mormont", "Tuổi": 50, "Độ Hảo Cảm": 10,
                 "Chức Vụ": "Hiệp sĩ lưu vong", "Nhà": "Mormont" } }
  (Không cần khai báo trước — hệ thống tự nhận path mới là "tạo mới".)

## ĐIỀU CẤM (QUAN TRỌNG)

✗ KHÔNG đụng field bắt đầu bằng dấu gạch dưới "_" (ví dụ _Seed Gốc, _HP Tối Đa, _Phòng Thủ).
  Đó là số của cỗ máy, ngươi ghi vào sẽ bị bỏ qua.
✗ KHÔNG tự đặt nhãn bậc: đừng ghi "Giai Đoạn Quan Hệ" hay "Giai Đoạn Đời" — hệ thống tự
  suy ra từ số. Ngươi chỉ chỉnh SỐ (Độ Hảo Cảm, Tuổi), nhãn tự cập nhật.
✗ KHÔNG tự tính kết quả trận đánh, số quân thương vong, ai thắng ai thua, tiến độ xây dựng,
  hay quân đi tới đâu. Khi có giao chiến, chỉ phát thẻ <combat_trigger> — cỗ máy sẽ tính và
  ghi kết quả. Ngươi kể lại kết quả đó ở lượt sau.
✗ KHÔNG ghi thẳng "Chủ Quyền Lãnh Thổ" (ai nắm vùng nào). Khi một vùng đổi chủ (chiếm được,
  liên minh sáp nhập, thừa kế), phát thẻ <territory_change region="regionId" house="houseId">
  — cỗ máy đổi chủ quyền + bản đồ tự đổi màu. Ghi thẳng sẽ bị bỏ qua.
✗ KHÔNG tự xếp "Thứ Tự Kế Vị" hay "Người Thừa Kế Hiện Tại" (13.4) — cỗ máy suy từ Luật Kế Vị
  và Thành Viên Gia Tộc. Ngươi chỉ ghi luật + thêm/bớt thành viên (kèm Tuổi/Giới Tính/Còn Sống).
✗ KHÔNG bịa thay đổi không có trong lời kể. Nếu ngươi không kể ra việc gì đó xảy ra, đừng
  cập nhật nó. Cập nhật phải KHỚP với những gì ngươi vừa viết.
✗ KHÔNG cập nhật hàng loạt field không liên quan "cho chắc". Chỉ cập nhật cái thực sự đổi.

## THỜI GIAN TRÔI

Nếu trong lời kể thời gian trôi qua (nghỉ ngơi, hành trình, "ba ngày sau", "một tháng trôi qua"),
BÁO cho cỗ máy bằng cách cập nhật ngày:
   { "op": "delta", "path": "stat_data.Thế Giới.Ngày", "value": 3 }
Cỗ máy sẽ tự động tick các tiến trình dài (xây dựng, hành quân, kinh tế, mùa màng) theo số ngày
này. ĐỪNG tự cập nhật các tiến trình đó — chỉ báo thời gian, cỗ máy lo phần còn lại.

## NGUYÊN TẮC VÀNG

Bảng trạng thái là SỰ THẬT của thế giới. Nếu trí nhớ của ngươi (đoạn hội thoại) mâu thuẫn với
bảng trạng thái đang hiển thị, hãy TIN BẢNG TRẠNG THÁI. Ví dụ: nếu bảng ghi một NPC đang "THÙ
ĐỊCH" với người chơi, đừng kể như thể họ vẫn thân thiết, dù đoạn chat cũ có vẻ vậy — chuyện đã
thay đổi và bảng phản ánh hiện tại.`;

/**
 * Prompt thẻ ngữ nghĩa (5.6) — dạy AI bọc nội dung đặc biệt trong thẻ
 * để frontend render component riêng (bộ tối thiểu M4).
 */
export const NARRATIVE_TAGS_PROMPT = `# THẺ NỘI DUNG ĐẶC BIỆT

Khi lời kể chứa các loại nội dung sau, bọc CHÍNH XÁC trong thẻ tương ứng (nội dung bên trong
viết bình thường, không JSON):

- Thư từ / quạ đưa tin: <raven_scroll>người gửi | nội dung thư</raven_scroll>
- Sự kiện bất ngờ quan trọng (ám sát, phản loạn, thiên tai, tin dữ):
  <event_popup>tiêu đề ngắn | mô tả sự kiện</event_popup>
- Phiên họp Tiểu Hội Đồng / họp gia tộc (13.3) — nêu vấn đề + 2-3 LỰA CHỌN quyết định,
  mỗi lựa chọn 1 dòng gạch đầu dòng kèm hé lộ hệ quả sau dấu "—":
  <council_session issue="vấn đề đang bàn" attendees="Tên A, Tên B, Tên C">
  - Nhãn lựa chọn thứ nhất — hé lộ hệ quả (vd: +Vàng, −Trung Thành)
  - Nhãn lựa chọn thứ hai — hé lộ hệ quả
  - Nhãn lựa chọn thứ ba — hé lộ hệ quả
  </council_session>
  DỪNG lời kể sau thẻ — người chơi bấm 1 lựa chọn, ngươi kể diễn biến + phản ứng thành viên ở lượt sau.
- Tình huống buộc phải giao chiến — phát thẻ với THUỘC TÍNH mô tả đối thủ (ước lượng
  hợp truyện của ngươi là INPUT cho cỗ máy tính, KHÔNG phải kết quả):
  <combat_trigger scale="Đấu Tay Đôi|Giao Tranh|Đại Chiến|Vây Thành" terrain="Đồng Bằng|Rừng Rậm|Đồi Núi|Đầm Lầy|Sông/Lối Vượt Sông|Tuyết/Băng Giá|Sa Mạc|Thành Trì (thủ)|Hẻm Núi"
    enemy="tên đối thủ/phe địch" enemy_size="số quân (nếu ≥ Giao Tranh)"
    enemy_quality="Tinh Nhuệ|Thành Thạo|Mới Lập Đội|Rời Rạc" enemy_general="tên tướng địch (nếu có)"
    enemy_hp="HP (nếu Đấu Tay Đôi)" enemy_ac="phòng thủ" enemy_dmg="1d8+2">bối cảnh giao chiến</combat_trigger>
  NGHIÊM CẤM: tự kể kết quả trận, ai thắng, thương vong. DỪNG lời kể ngay sau thẻ —
  cỗ máy sẽ phân giải, ngươi tường thuật kết quả ở lượt sau.
- Một vùng đổi chủ (chiếm được sau vây thành, liên minh sáp nhập, thừa kế lãnh thổ):
  <territory_change region="regionId (vd the-north, the-riverlands)" house="houseId Nhà mới nắm
    (vd stark, lannister; rỗng nếu thành vô chủ)">bối cảnh đổi chủ ngắn</territory_change>
  Cỗ máy sẽ đổi màu bản đồ + mở/đóng quản trị lãnh địa. regionId hợp lệ: the-north, the-vale,
  the-riverlands, the-westerlands, the-crownlands, the-reach, the-stormlands, dorne, the-iron-islands.

Chỉ dùng khi thật sự có loại nội dung đó. Văn tường thuật bình thường KHÔNG bọc thẻ.`;

/**
 * Bút pháp tường thuật trận đánh (7.11) — chèn vào context lượt KẾ sau khi
 * engine phân giải xong, đi kèm khối <battle_report> engine đã điền sẵn.
 */
export const BATTLE_NARRATION_PROMPT = `# TƯỜNG THUẬT TRẬN ĐÁNH (bắt buộc lượt này)

Trận đánh đã được cỗ máy phân giải xong. Khối <battle_report> bên dưới là KẾT QUẢ ĐÃ CHỐT.

NHIỆM VỤ CỦA NGƯƠI:
1. Chèn NGUYÊN VĂN khối <battle_report>...</battle_report> được cung cấp vào đầu phản hồi
   (hệ thống sẽ vẽ thành thẻ tóm tắt — đừng sửa số nào trong đó).
2. Sau thẻ, viết văn tường thuật theo nhịp BA BƯỚC:
   a) BÀY TRẬN & XUẤT QUÂN — thế đất, hàng ngũ, khí thế hai bên, tâm thế chủ tướng.
   b) ĐIỂM TIẾP CHIẾN THEN CHỐT — dùng đúng "Diễn biến then chốt" trong báo cáo; bước ngoặt
      phải có nguyên cớ rõ ràng, không thắng/thua khơi khơi.
   c) TĨNH BÚT THU LẠI — khoảng lặng sau trận: cờ rách, đao gãy, tà dương, tiếng rên thương binh.

RÀNG BUỘC:
- Số liệu hoà vào văn ("tổn hơn ba trăm nhân mã"), KHÔNG đọc lại bảng phán định trong văn xuôi.
- GIỮ ĐÚNG kết quả cỗ máy — không được kể thắng khi báo cáo ghi bại.
- Chất Westeros: bùn tuyết, tù và, huy hiệu Nhà tung bay, sự tàn khốc không tô hồng.
- Cuối phản hồi vẫn trả khối <UpdateVariable> như thường lệ (hệ quả NGOÀI các con số trận đánh
   — hảo cảm, ký ức NPC, thời gian trôi; số quân/thương vong cỗ máy ĐÃ ghi, đừng ghi lại).`;

/**
 * Prompt hướng dẫn AI cập nhật bằng SQL — chế độ Auto Database.
 * Tham khảo Auto Database (Tinh Hà Thôi Xán) nhưng tối giản cho iceandfire.
 */
export const DICE_ROLL_PROMPT = `# HỆ THỐNG XÁC SUẤT VÀ CHỈ SỐ (GAME MASTER)

Ngươi đóng vai trò là một Game Master VÔ TƯ và NGHIÊM KHẮC. Mọi hành động có rủi ro của người chơi (VD: lén lút, thuyết phục, chiến đấu nhỏ lẻ, leo trèo, lừa gạt) đều KHÔNG CHẮC CHẮN thành công.
1. KHI NGƯỜI CHƠI HÀNH ĐỘNG RỦI RO: Ngươi PHẢI ngầm gieo xúc xắc (D20) cộng với (Chỉ Số cốt lõi liên quan / 2) và (Cấp Kỹ Năng tương ứng nếu có).
2. KIỂM TRA ĐỘ KHÓ (DC):
   - Việc dễ: DC 10
   - Việc vừa: DC 15
   - Việc khó: DC 20
   - Việc phi thường: DC 25+
3. KẾT QUẢ: Nếu Tổng < Độ khó, hành động đó BẮT BUỘC THẤT BẠI. Đừng ngại cho nhân vật gãy tay, bị phát hiện, hoặc mất mặt nếu chỉ số của họ quá thấp mà đòi làm việc quá sức.
4. BÁO CÁO NGẦM: Bắt đầu đoạn mô tả hậu quả, hãy chèn một thông báo ngoặc vuông để người chơi biết hệ thống đang hoạt động, ví dụ: \`[Kiểm tra Nhanh Nhẹn + Kỹ Năng Lén Lút: Thất Bại]\` hoặc \`[Kiểm tra Uy Tín: Thành Công]\`.
5. HỆ THỐNG TÍN NGƯỠNG:
   - Nếu có hành động tế lễ, cầu nguyện chân thành hoặc hợp ý Thần: Hãy thưởng điểm Đức Tin/Ân Sủng (thông qua SQL Update).
   - Nếu báng bổ, phá đền, phá lời thề: Trừ nặng Đức Tin/Ân Sủng, đồng thời tạo ra "Vận rủi" (Tăng DC của các hành động tiếp theo).
   - Nếu Ân Sủng > 50: Đôi khi hãy ngầm cộng thêm buff vào xúc xắc của người chơi, giải thích ngầm bằng việc "Thần linh phù hộ".`;

export const SQL_UPDATE_PROMPT = `# QUY TẮC CẬP NHẬT CƠ SỞ DỮ LIỆU

Sau MỖI lượt kể, ngươi PHẢI xuất các câu lệnh SQL cập nhật cơ sở dữ liệu, đặt ở CUỐI phản hồi,
phản ánh chính xác những gì vừa xảy ra TRONG LỜI KỂ của ngươi. Người chơi sẽ không thấy khối
này (hệ thống tự ẩn) — nó chỉ để cập nhật cỗ máy trò chơi.

## ĐỊNH DẠNG

Bọc các câu SQL trong thẻ:

<tableEdit>
UPDATE nhan_vat_chinh SET hp = hp - 15, vang = vang + 200 WHERE row_id = 1;
INSERT INTO tui_do (row_id, ten_vat_pham, so_luong, mo_ta) VALUES ((SELECT COALESCE(MAX(row_id),0)+1 FROM tui_do), 'Kiếm Valyria', 1, 'Kiếm thép Valyria cổ');
UPDATE npc_chinh SET do_hao_cam = do_hao_cam + 10 WHERE ho_ten = 'Tyrion Lannister';
</tableEdit>

Nếu lượt này KHÔNG có gì thay đổi (chỉ đối thoại xã giao), KHÔNG cần xuất thẻ <tableEdit>.

## QUY TẮC SQL

1. CHỈ dùng 3 loại: INSERT INTO / UPDATE / DELETE FROM.
2. Mỗi câu kết thúc bằng dấu chấm phẩy (;).
3. UPDATE và DELETE BẮT BUỘC có WHERE.
4. Dùng biểu thức delta khi thay đổi số: hp = hp - 10, vang = vang + 200.
5. Khi INSERT, row_id dùng: (SELECT COALESCE(MAX(row_id),0)+1 FROM tên_bảng).
6. Giá trị chuỗi bọc nháy đơn (''), thoát nháy đơn bằng 2 nháy đơn ('').
7. KHÔNG đụng các trường bắt đầu bằng dấu "_" (engine tự quản lý).

## GHI NHỚ QUAN TRỌNG

- HP, thời gian, vàng, kỹ năng: dùng delta (hp = hp - 10) KHÔNG dùng giá trị tuyệt đối.
- NPC: dùng WHERE ho_ten = 'Tên NPC' để định vị (KHÔNG dùng row_id cho NPC).
- Vật phẩm: INSERT khi nhận mới, UPDATE so_luong khi nhận thêm, DELETE khi dùng hết.
- Quan hệ thay đổi? UPDATE do_hao_cam / tin_cay của NPC tương ứng.
- Di chuyển? UPDATE the_gioi SET vi_tri = 'Nơi mới' WHERE row_id = 1.
- Thời gian trôi? UPDATE the_gioi SET ngay = ngay + N WHERE row_id = 1.

Tham khảo DDL và ví dụ SQL trong khối CƠ SỞ DỮ LIỆU TRẠNG THÁI bên dưới.`;
