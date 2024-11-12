"use strict";

// 點 X 清除搜尋框文字
function clearInput() {
  document.getElementById("searchInput").value = ""; // 清空輸入框
  populateTable(st_data); // 恢復顯示所有學生資料
  toggleClearButton(); // 更新清除按鈕的顯示
}

// Enter 搜尋
document
  .getElementById("searchInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      searchTable(); // 當按下 Enter 鍵時觸發搜尋
    }
  });

// 根據輸入搜尋欄位
// function searchTable() {
//   const input = document.getElementById("searchInput").value.toLowerCase();
//   const filteredData = st_data.filter((student) => {
//     return (
//       student.st_id.toString().includes(input) ||
//       student.st_name.toLowerCase().includes(input) ||
//       student.st_tr_id.toString().includes(input) ||
//       student.st_tr_name.toLowerCase().includes(input) ||
//       student.st_classtime_id.toString().includes(input) ||
//       student.st_classroom_name.toLowerCase().includes(input)
//     );
//   });
//   populateTable(filteredData); // 更新表格
// }
