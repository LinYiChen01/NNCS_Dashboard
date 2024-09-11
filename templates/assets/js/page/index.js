"use strict";

// var ctx = document.getElementById("myChart").getContext('2d');
// var myChart = new Chart(ctx, {
//   type: 'line',
//   data: {
//     labels: ["January", "February", "March", "April", "May", "June", "July", "August"],
//     datasets: [{
//       label: 'Sales',
//       data: [3200, 1800, 4305, 3022, 6310, 5120, 5880, 6154],
//       borderWidth: 2,
//       backgroundColor: 'rgba(63,82,227,.8)',
//       borderWidth: 0,
//       borderColor: 'transparent',
//       pointBorderWidth: 0,
//       pointRadius: 3.5,
//       pointBackgroundColor: 'transparent',
//       pointHoverBackgroundColor: 'rgba(63,82,227,.8)',
//     },
//     {
//       label: 'Budget',
//       data: [2207, 3403, 2200, 5025, 2302, 4208, 3880, 4880],
//       borderWidth: 2,
//       backgroundColor: 'rgba(254,86,83,.7)',
//       borderWidth: 0,
//       borderColor: 'transparent',
//       pointBorderWidth: 0 ,
//       pointRadius: 3.5,
//       pointBackgroundColor: 'transparent',
//       pointHoverBackgroundColor: 'rgba(254,86,83,.8)',
//     }]
//   },
//   options: {
//     legend: {
//       display: false
//     },
//     scales: {
//       yAxes: [{
//         gridLines: {
//           // display: false,
//           drawBorder: false,
//           color: '#f2f2f2',
//         },
//         ticks: {
//           beginAtZero: true,
//           stepSize: 1500,
//           callback: function(value, index, values) {
//             return '$' + value;
//           }
//         }
//       }],
//       xAxes: [{
//         gridLines: {
//           display: false,
//           tickMarkLength: 15,
//         }
//       }]
//     },
//   }
// });

function updateDropdown(element, text) {
  // 更新按鈕文本
  document.getElementById("dropdownMenuButton").textContent = text;

  // 移除所有項目的 active 類別
  var items = document.querySelectorAll(".dropdown-item");
  items.forEach(function (item) {
    item.classList.remove("active");
  });

  // 為當前點選的項目添加 active 類別
  element.classList.add("active");
}
document.addEventListener("DOMContentLoaded", function () {
  // 模擬的教室數據，可以從服務器獲取或其他方式獲得

  const classroomData = [];
  for (let i = 0; i < classroom.length; i++) {
    classroomData.push({
      classroom: classroom[i],
      class_week: class_week[i],
      start_time: start_time[i],
      end_time: end_time[i],
    });
  }

  // 查看各教室上課時段
  function updateClassroomList(selectedClassroom) {
    const listElement = document.getElementById("classroom-list");
    listElement.innerHTML = ""; // Clear the list

    const groupedData = {};

    // Grouping the data
    classroomData.forEach(function (item) {
      if (
        selectedClassroom === "全部" ||
        item.classroom.startsWith(selectedClassroom)
      ) {
        if (!groupedData[item.classroom]) {
          groupedData[item.classroom] = {};
        }
        if (!groupedData[item.classroom][item.class_week]) {
          groupedData[item.classroom][item.class_week] = [];
        }
        groupedData[item.classroom][item.class_week].push(
          `${item.start_time}-${item.end_time}`
        );
      }
    });

    // Create list items
    for (const [classroom, weeks] of Object.entries(groupedData)) {
      const listItem = document.createElement("li");
      listItem.classList.add("media");
      listItem.style=("border-bottom: 1px solid #98a6ad;}");
      const weekStrings = [];
      for (const [week, times] of Object.entries(weeks)) {
        weekStrings.push(
          `星期${week}  ${times.join("<br>&emsp;&emsp;&emsp; ")}`
        );
      }
      const weekText = weekStrings.join("<br>");

      listItem.innerHTML = `
            <img class="mr-3 rounded" width="55" src="assets/img/products/product-3-50.png" alt="product">
            <div class="media-body" style="line-height: 30px;">
                <div class="media-title">${classroom}</div>
                <div class="mt-1">
                    <div class="budget-price">
                        <div class="budget-price-label">${weekText}</div>
                    </div>
                </div>
            </div>
        `;

      listElement.appendChild(listItem);
    }
  }

  // 更新下拉選單和 <ul> 的內容
  window.updateDropdown = function (element, selectedClassroom) {
  // 更新下拉選單按鈕的文字
  document.getElementById("dropdownMenuButton").textContent = selectedClassroom;

  // 更新下拉選單項目的活躍狀態
  var items = document.querySelectorAll(".dropdown-item");
  items.forEach(function (item) {
    item.classList.remove("active");
  });
  element.classList.add("active");

  // 更新 <ul> 的內容
  updateClassroomList(selectedClassroom);
  };

  // 初始時顯示所有教室
  updateClassroomList("全部");
});

// var balance_chart = document.getElementById("balance-chart").getContext("2d");

// var balance_chart_bg_color = balance_chart.createLinearGradient(0, 0, 0, 70);
// balance_chart_bg_color.addColorStop(0, "rgba(63,82,227,.2)");
// balance_chart_bg_color.addColorStop(1, "rgba(63,82,227,0)");

// var myChart = new Chart(balance_chart, {
//   type: "line",
//   data: {
//     labels: [
//       "16-07-2018",
//       "17-07-2018",
//       "18-07-2018",
//       "19-07-2018",
//       "20-07-2018",
//       "21-07-2018",
//       "22-07-2018",
//       "23-07-2018",
//       "24-07-2018",
//       "25-07-2018",
//       "26-07-2018",
//       "27-07-2018",
//       "28-07-2018",
//       "29-07-2018",
//       "30-07-2018",
//       "31-07-2018",
//     ],
//     datasets: [
//       {
//         label: "Balance",
//         data: [50, 61, 80, 50, 72, 52, 60, 41, 30, 45, 70, 40, 93, 63, 50, 62],
//         backgroundColor: balance_chart_bg_color,
//         borderWidth: 3,
//         borderColor: "rgba(63,82,227,1)",
//         pointBorderWidth: 0,
//         pointBorderColor: "transparent",
//         pointRadius: 3,
//         pointBackgroundColor: "transparent",
//         pointHoverBackgroundColor: "rgba(63,82,227,1)",
//       },
//     ],
//   },
//   options: {
//     layout: {
//       padding: {
//         bottom: -1,
//         left: -1,
//       },
//     },
//     legend: {
//       display: false,
//     },
//     scales: {
//       yAxes: [
//         {
//           gridLines: {
//             display: false,
//             drawBorder: false,
//           },
//           ticks: {
//             beginAtZero: true,
//             display: false,
//           },
//         },
//       ],
//       xAxes: [
//         {
//           gridLines: {
//             drawBorder: false,
//             display: false,
//           },
//           ticks: {
//             display: false,
//           },
//         },
//       ],
//     },
//   },
// });

// var sales_chart = document.getElementById("sales-chart").getContext("2d");

// var sales_chart_bg_color = sales_chart.createLinearGradient(0, 0, 0, 80);
// balance_chart_bg_color.addColorStop(0, "rgba(63,82,227,.2)");
// balance_chart_bg_color.addColorStop(1, "rgba(63,82,227,0)");

// var myChart = new Chart(sales_chart, {
//   type: "line",
//   data: {
//     labels: [
//       "16-07-2018",
//       "17-07-2018",
//       "18-07-2018",
//       "19-07-2018",
//       "20-07-2018",
//       "21-07-2018",
//       "22-07-2018",
//       "23-07-2018",
//       "24-07-2018",
//       "25-07-2018",
//       "26-07-2018",
//       "27-07-2018",
//       "28-07-2018",
//       "29-07-2018",
//       "30-07-2018",
//       "31-07-2018",
//     ],
//     datasets: [
//       {
//         label: "Sales",
//         data: [70, 62, 44, 40, 21, 63, 82, 52, 50, 31, 70, 50, 91, 63, 51, 60],
//         borderWidth: 2,
//         backgroundColor: balance_chart_bg_color,
//         borderWidth: 3,
//         borderColor: "rgba(63,82,227,1)",
//         pointBorderWidth: 0,
//         pointBorderColor: "transparent",
//         pointRadius: 3,
//         pointBackgroundColor: "transparent",
//         pointHoverBackgroundColor: "rgba(63,82,227,1)",
//       },
//     ],
//   },
//   options: {
//     layout: {
//       padding: {
//         bottom: -1,
//         left: -1,
//       },
//     },
//     legend: {
//       display: false,
//     },
//     scales: {
//       yAxes: [
//         {
//           gridLines: {
//             display: false,
//             drawBorder: false,
//           },
//           ticks: {
//             beginAtZero: true,
//             display: false,
//           },
//         },
//       ],
//       xAxes: [
//         {
//           gridLines: {
//             drawBorder: false,
//             display: false,
//           },
//           ticks: {
//             display: false,
//           },
//         },
//       ],
//     },
//   },
// });

// $("#products-carousel").owlCarousel({
//   items: 3,
//   margin: 10,
//   autoplay: true,
//   autoplayTimeout: 5000,
//   loop: true,
//   responsive: {
//     0: {
//       items: 2,
//     },
//     768: {
//       items: 2,
//     },
//     1200: {
//       items: 3,
//     },
//   },
// });
