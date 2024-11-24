"use strict";

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
            <img class="mr-3 rounded" width="55" src="assets/img/products/product-4-50.png" alt="product">
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