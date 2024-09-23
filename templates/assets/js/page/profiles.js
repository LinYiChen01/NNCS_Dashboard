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


var statistics_chart = document.getElementById('myChart').getContext('2d');

// // 計算時間相關的數據
var totalDays = 168;  // 總天數
var today = moment(); // 獲取當前日期
var start_class_date = moment('2024/9/02'); // 設定開始日期
var daysElapsed = today.diff(start_class_date, 'days') + 2; // 計算經過的天數
var remainingDays = totalDays; // 剩餘天數

//     datasets: [
//       {
//         label: '總上課堂數',  // 總課堂數數據
//         data: [class_num],  // 總堂數
//         magrin : '10px',
//         backgroundColor: 'rgba(255, 206, 86, 0.7)',  // 總堂數的顏色
//         borderColor: 'rgba(255, 206, 86, 1)',
//         borderWidth: 2.5,
//         // stack: '2',
//       },
//       {
//       label: '累計天數',  // 上課堂數數據
//       data: [daysElapsed],  // 目前已上課的堂數
//       backgroundColor: 'rgba(54, 162, 235, 0.7)',  // 已上課部分顏色
//       borderColor: 'rgba(54, 162, 235, 1)',
//       borderWidth: 2.5,
//       // stack: '0',
//       }, {
//         label: '剩餘堂數',  // 剩餘堂數數據
//         data: [168 - daysElapsed],  // 剩餘堂數
//         backgroundColor: 'rgba(254, 86, 83, 0.7)',  // 剩餘部分顏色
//         borderColor: 'rgba(254, 86, 83, 1)',
//         borderWidth: 2.5,
//         // stack: '0',
//       }, ]
//   },
//   options: {
//     scales: {
//       xAxes: [{
//         stacked: false,  // 啟用堆疊
//         gridLines: {
//           drawBorder: false,
//           color: '#f2f2f2',
//         },
//         ticks: {
//           beginAtZero: true,
//           stepSize: 16,
//         },
//         // categoryPercentage: 1  // 條形之間的間隔，數值越小間隔越大
//       }],
//       yAxes: [{
//         stacked: false,  // 啟用堆疊
//         gridLines: {
//           display: false
//         },
//         ticks: {
//           display: true
//         }
//       }]
//     },
//     legend: {
//       display: false,  // 顯示圖例
//       position: 'bottom',
//     },
//     tooltips: {
//       enabled: true,  // 啟用工具提示
//       mode: 'index',  // 顯示所有相關數據
//       intersect: false,  // 不必在條形上交錯
//     },
//   }
// });


var statistics_chart = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(statistics_chart, {  
  type: 'horizontalBar',  // 使用 2.7.1 的橫向柱狀圖類型
  data: {
    labels: ["已累計上課數", '000'],  // 類別標籤
    datasets: [{
      label: '已上課堂數',  // 上課堂數數據
      data: [class_num, null],  // 目前已上課的堂數
      backgroundColor: 'rgba(54, 162, 235, 0.7)',  // 已上課部分顏色
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2.5,
    }, {
      label: '剩餘堂數',  // 剩餘堂數數據
      data: [20 - class_num, 7],  // 總堂數 - 已上課堂數
      backgroundColor: 'rgba(254, 86, 83, 0.7)',  // 剩餘部分顏色
      borderColor: 'rgba(254, 86, 83, 1)',
      borderWidth: 2.5,
    }]
  },
  options: {
    scales: {
      xAxes: [{  // X 軸顯示數據
        stacked: true,  // 啟用堆疊
        gridLines: {
          drawBorder: false,
          color: '#f2f2f2',
        },
        ticks: {
          beginAtZero: true,  // X 軸從 0 開始
          // stepSize: 150  // 可選擇每多少個刻度
        }
      }],
      yAxes: [{  // Y 軸顯示類別
        stacked: true,  // 啟用堆疊
        gridLines: {
          display: false  // 隱藏 Y 軸的網格線
        },
        ticks: {
          display: true  // 顯示 Y 軸的類別標籤
        }
      }]
    },
    legend: {
      display: true,  // 如果你想要顯示圖例
      position: 'bottom',
    }
  }
});





// 更新出席紀錄表格
// var ctx = document.getElementById("myChart").getContext('2d');
// var myChart = new Chart(ctx, {
//   type: 'horizontalBar',
//   data: {
//     labels: ["已上課堂數", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],  // 標籤
//     datasets: [{
//       label: '每月天數',
//       data: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],  // 每個月的天數
//       borderWidth: 2,
//       backgroundColor: 'rgba(254,86,83,.7)',  // 顏色
//       borderColor: 'rgba(254,86,83,.7)',
//       borderWidth: 2.5,
//       pointBackgroundColor: '#ffffff',
//       pointRadius: 4
//     }]
//   },
//   options: {
//     legend: {
//       display: false
//     },
//     scales: {
//       yAxes: [{
//         gridLines: {
//           drawBorder: false,
//           color: '#f2f2f2',
//         },
//         ticks: {
//           beginAtZero: true,
//           stepSize: 5  // 根據需求調整步長
//         }
//       }],
//       xAxes: [{
//         gridLines: {
//           display: false
//         },
//         ticks: {
//           beginAtZero: true,
//           stepSize: 10  // 根據需求調整步長
//         }
//       }]
//     },
//   }
// });



function updateAttendTable(selectedStatus) {
  const tableBody = document.querySelector("#attend-table tbody");
  tableBody.innerHTML = ""; // 清空表格

  const filteredData = attend_data.filter(function(item) {
    if (selectedStatus === "全部") {
      return true;
    }
    return item.status === selectedStatus;
  });
  const attendanceCounts = {
    "上課": 0,
    "請假": 0,
    "曠課": 0,
    "停課": 0
  };

  filteredData.forEach(function (item) {
    attendanceCounts[item.status] = (attendanceCounts[item.status] || 0) + 1;
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
      本學期累計: 上課: ${attendanceCounts["上課"]}  請假: ${attendanceCounts["請假"]}  曠課: ${attendanceCounts["曠課"]}  停課: ${attendanceCounts["停課"]}，
      剩餘上課次數: ${20 - attendanceCounts["上課"] - attendanceCounts["曠課"]}
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