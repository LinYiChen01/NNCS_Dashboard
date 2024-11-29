"use strict";

const MAX_FILE_SIZE = 64 * 1024 // 64KB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

var pic_msg = document.getElementById("tr_pic_msg"); // 获取 msg 元素
var img_data = document.getElementById("tr_uploadedImage");
var submit_msg = document.getElementById("tr_submit_msg");

document.getElementById("tr_uploadButton").addEventListener("click", function() {
  document.getElementById("tr_file").click();
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

document.getElementById("tr_file").addEventListener("change", async function () {
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

// 获取页面元素
const trScheduleElement = document.getElementById('tr_schedule');
const trCourseElement = document.getElementById('tr_course');

// 格式化并显示授课时段
const scheduleHtml = Object.values(tr_schedule)
  .map(schedule => `
    授課教室: ${schedule.classroom_name}<br>
    授課時段: 禮拜${schedule.class_week} ${schedule.start_time} - ${schedule.end_time}<br>
    可接納學生數: ${schedule.st_num}
  `)
  .join('<hr>');
trScheduleElement.innerHTML = scheduleHtml;

// 格式化并显示授课科目
// 将课程名称渲染为 HTML
const coursesHtml = Object.values(tr_course)
  .map(course => `${course.name}`)
  .join("<br>");

// 显示到指定位置
trCourseElement.innerHTML = coursesHtml;