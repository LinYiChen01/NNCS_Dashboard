"use strict";

const MAX_FILE_SIZE = 64 * 1024 // 64KB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

var pic_msg = document.getElementById("pic_msg"); // 获取 msg 元素
var img_data = document.getElementById("uploadedImage");
var submit_msg = document.getElementById("submit_msg");

document.getElementById("uploadButton").addEventListener("click", function() {
  document.getElementById("file").click();
});


function detectFileType(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const arrayBuffer = event.target.result;
      const bytes = new Uint8Array(arrayBuffer);

      // Example magic numbers (you may need more or different ones depending on file types)
      const magicNumbers = {
        'jpg': [0xFF, 0xD8, 0xFF],
        'png': [0x89, 0x50, 0x4E, 0x47],
        'gif': [0x47, 0x49, 0x46, 0x38],
        'webp': [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]
      };

      let detectedType = null;

      for (const [type, magic] of Object.entries(magicNumbers)) {
        if (bytes.slice(0, magic.length).every((val, index) => val === magic[index])) {
          detectedType = type;
          break;
        }
      }

      resolve(detectedType);
    };
    reader.onerror = reject;

    // Read the first 12 bytes to cover all examples
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

document.getElementById("file").addEventListener("change", async function () {
  var file = this.files[0];
  if (file) {
    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      // img_data.src = '';
      img_data.style.display = 'none'; // 隐藏图片
      pic_msg.textContent = `上傳圖片過大，圖片大小最大為 ${MAX_FILE_SIZE / 1024} KB。`;
      pic_msg.style.color = "red";
      return;
    }
    
    try {
      const fileType = await detectFileType(file);
      if (fileType && ALLOWED_EXTENSIONS.includes(fileType)) {
        // 文件有效，读取并显示
        var reader = new FileReader();
        reader.onload = function (e) {
          pic_msg.textContent = ''
          img_data.src = e.target.result;
          img_data.style.display = 'block'; // 显示图片
        };
        reader.readAsDataURL(file);
      } else {
        // img_data.src = "";
        img_data.style.display = 'none'; // 隐藏图片
        pic_msg.textContent = "僅能上傳圖片副檔名為: jpg、jpeg、png、webp";
        pic_msg.style.color = "red";
        // $("#updateModal").modal("show");
      }
    } catch (error) {
      // img_data.src = "";
      img_data.style.display = 'none'; // 隐藏图片
      pic_msg.textContent = "無法辨識圖片檔案，請更換圖片上傳";
      pic_msg.style.color = "red";
      // $("#updateModal").modal("show");
    }
  }
});

// // 监听模态框关闭事件以移除背景虚化
// $("#updateModal").on("hidden.bs.modal", function () {
//   removeBlur();
// });

// 提交表单的处理（可选）
// function submitUpdateForm() {
//   if (pic_msg.textContent != "") {
//     $("#updateModal").modal("show");
//     submit_msg.textContent = "資料有誤，請重新確認!"
//   }
//   else { 
//     $("#updateModal").modal("hide");
//     var form = document.getElementById("updateForm");
//     form.submit();
//   }
//   }
// }
