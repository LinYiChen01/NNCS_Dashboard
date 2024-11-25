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


// 計算時間相關的數據
var totalDays = 168;  // 總天數
var today = moment(); // 獲取當前日期
var daysElapsed
if (today.isBefore(start_class_date)) {
  // 如果今天早于开始日期
  daysElapsed = 0;
  console.log('daysElapsed bbbb', daysElapsed);
} else {
  // 计算日期差并加 2 天
  daysElapsed = today.diff(start_class_date, 'days') + 2;
  console.log('daysElapsed', daysElapsed);
}
var remainingDays = totalDays; // 剩餘天數

var statistics_chart = document.getElementById('myChart_1').getContext('2d');  // JavaScript 對應的 id
var myChart_1 = new Chart(statistics_chart, {
  type: 'horizontalBar',
  data: {
    labels: ["累計上課堂數", '累計上課天數', '剩餘上課天數'],
    datasets: [
      {
        data: [class_num, daysElapsed, 168 - daysElapsed],
        backgroundColor: ['#6777ef', '#ffc264', '#fe8886'],
        borderColor: ['#6777ef', '#ffc264', '#fe8886'],
        borderWidth: 2.5,
      }
    ]
  },
  options: {
    scales: {
      xAxes: [{
        stacked: false,
        gridLines: {
          drawBorder: false,
          color: '#f2f2f2',
        },
        ticks: {
          beginAtZero: true,
          // stepSize: 16,
        },
      }],
      yAxes: [{
        stacked: false,
        gridLines: {
          display: false,
        },
        ticks: {
          display: true,
        }
      }]
    },
    legend: {
      display: false,
    },
  }
});

var ctx2 = document.getElementById('myChart_2').getContext('2d');
var myChart_2 = new Chart(ctx2, {
    type: 'bar',  // 第二個圖表使用折線圖
    data: {
        labels: ['上課', '請假', '曠課', '停課'],
        datasets: [{
            label: '堂數',
            data: [attendanceCounts["上課"], attendanceCounts["請假"], attendanceCounts["曠課"], attendanceCounts["停課"]],
            backgroundColor: '#6777ef',
            borderColor: '#6777ef',
            borderWidth: 1
        }]
    },
    options: {
      scales: {
        xAxes: [{
          stacked: false,
          gridLines: {
            drawBorder: false,
            color: '#f2f2f2',
          },
          ticks: {
            beginAtZero: true,
            // stepSize: 1,
          },
        }],
        yAxes: [{
          stacked: false,
          gridLines: {
            display: false,
          },
          ticks: {
            display: true,
            beginAtZero: true, // 從 0 開始
            // stepSize: 1,       // 確保每次增量為 1
            precision: 0,      // 設定小數點位數為 0（即無小數點）
          }
        }]
      },
      legend: {
        display: false,
      },
    }
  });

  
function updateAttendTable(selectedStatus) {
  const tableBody = document.querySelector("#attend-table tbody");
  tableBody.innerHTML = ""; // 清空表格

  const filteredData = attend_data.filter(function(item) {
    if (selectedStatus === "全部") {
      return true;
    }
    return item.status === selectedStatus;
  });

  filteredData.forEach(function (item) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${moment(item.class_date).format('YYYY-MM-DD')}</td>
      <td>${item.classroom_name}</td>
      <td>${item.start_time} - ${item.end_time}</td>
      <td>${item.status}</td>
    `;
    tableBody.appendChild(row);
  });
  // 更新 footer 顯示內容
  if (selectedStatus === "全部") {
    document.getElementById("attendance-footer").innerHTML = `
      本學期累計: 上課: ${attendanceCounts["上課"] || 0}  請假: ${attendanceCounts["請假"] || 0}  曠課: ${attendanceCounts["曠課"] || 0}  停課: ${attendanceCounts["停課"] || 0}，
      剩餘上課次數: ${20 - (attendanceCounts["上課"] || 0) - (attendanceCounts["曠課"] || 0)}
    `;
  } else {
    const count = filteredData.length;
    document.getElementById("attendance-footer").textContent = `本學期累計: ${selectedStatus}：${count}`;
  }
}

// 更新下拉選單和表格的內容
window.updateDropdown = function(element, selectedStatus) {
  document.getElementById("dropdownMenuButton").textContent = selectedStatus;

  var items = document.querySelectorAll(".dropdown-item");
  items.forEach(function(item) {
    item.classList.remove("active");
  });
  element.classList.add("active");

  updateAttendTable(selectedStatus);
};

// 初始時顯示所有出席紀錄
updateAttendTable("全部");