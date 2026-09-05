// Content Loader — đọc các gói nội dung JSON (theo content-schema.json),
// kiểm tra hợp lệ, gộp lại thành 1 danh sách từ vựng phẳng dùng chung cho
// Learning Engine + UI. Không phụ thuộc môn học cụ thể.

function validateItem(item, packId, errors) {
  var prefix = 'pack "' + packId + '" item "' + (item && item.id) + '"';
  if (!item || typeof item !== 'object') {
    errors.push(prefix + ': không phải object');
    return false;
  }
  if (!item.id || typeof item.id !== 'string') {
    errors.push(prefix + ': thiếu "id"');
    return false;
  }
  if (!item.type || typeof item.type !== 'string') {
    errors.push(prefix + ': thiếu "type"');
  }
  if (!item.prompt_audio_text || typeof item.prompt_audio_text !== 'string') {
    errors.push(prefix + ': thiếu "prompt_audio_text"');
  }
  var answer = item.answer;
  if (!answer || typeof answer !== 'object') {
    errors.push(prefix + ': thiếu "answer"');
    return false;
  }
  if (!answer.text_en || typeof answer.text_en !== 'string') {
    errors.push(prefix + ': thiếu "answer.text_en"');
  }
  if (!answer.text_vi || typeof answer.text_vi !== 'string') {
    errors.push(prefix + ': thiếu "answer.text_vi"');
  }
  if (!answer.emoji && !answer.image) {
    errors.push(prefix + ': cần ít nhất 1 trong "answer.emoji" hoặc "answer.image" để hiển thị');
  }
  return true;
}

function validatePack(pack, errors) {
  if (!pack || typeof pack !== 'object') {
    errors.push('pack không phải object');
    return false;
  }
  if (!pack.pack_id) errors.push('pack thiếu "pack_id"');
  if (!pack.category) errors.push('pack "' + pack.pack_id + '" thiếu "category"');
  if (!Array.isArray(pack.items)) {
    errors.push('pack "' + pack.pack_id + '" thiếu "items" (mảng)');
    return false;
  }
  return true;
}

// Chuẩn hoá 1 pack đã qua kiểm tra thành danh sách từ phẳng, gắn thêm
// "cat"/"catLabel"/"catIcon" lấy từ metadata của pack để UI lọc theo chủ đề.
function flattenPack(pack) {
  return pack.items
    .filter(function (item) { return item && item.id && item.answer; })
    .map(function (item) {
      return {
        id: item.id,
        type: item.type || 'vocab',
        en: item.answer.text_en,
        vi: item.answer.text_vi,
        emoji: item.answer.emoji || null,
        image: item.answer.image || null,
        // Video lặp (mp4) tuỳ chọn — khi có, UI ưu tiên hiển thị video động
        // thay cho ảnh tĩnh "image" (dùng làm ảnh dự phòng nếu video lỗi).
        video: item.answer.video || null,
        promptAudioText: item.prompt_audio_text || item.answer.text_en,
        difficulty: typeof item.difficulty === 'number' ? item.difficulty : 1,
        cat: pack.category,
        catLabel: pack.category_label_vi || pack.category,
        catIcon: pack.category_icon || null,
        packId: pack.pack_id
      };
    });
}

// Tải và gộp nhiều content pack. Trả về { words, categories, errors }.
// errors không làm hỏng cả game — pack lỗi bị bỏ qua, phần còn lại vẫn chạy,
// lỗi được log ra console để người biên soạn nội dung sửa.
export async function loadContentPacks(urls) {
  var errors = [];
  var words = [];
  var categories = [];
  var seenCat = {};

  var results = await Promise.all(
    urls.map(function (url) {
      return fetch(url)
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .catch(function (e) {
          errors.push('Không tải được "' + url + '": ' + e.message);
          return null;
        });
    })
  );

  results.forEach(function (pack) {
    if (!pack) return;
    if (!validatePack(pack, errors)) return;
    var packErrors = [];
    pack.items.forEach(function (item) { validateItem(item, pack.pack_id, packErrors); });
    errors = errors.concat(packErrors);

    flattenPack(pack).forEach(function (w) { words.push(w); });

    if (!seenCat[pack.category]) {
      seenCat[pack.category] = true;
      categories.push({
        id: pack.category,
        label: pack.category_label_vi || pack.category,
        icon: pack.category_icon || null
      });
    }
  });

  if (errors.length) {
    console.warn('[content-loader] Lỗi nội dung:\n' + errors.join('\n'));
  }

  return { words: words, categories: categories, errors: errors };
}
