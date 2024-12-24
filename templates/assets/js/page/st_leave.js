"use strict";

function clearInput() {
  document.getElementById("searchInput").value = ""; // 清空輸入框
  populateTable(leave_st_data); // 恢復顯示所有學生資料
}

// 監聽輸入框的 Enter 鍵
document
  .getElementById("searchInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      searchTable(); // 當按下 Enter 鍵時觸發搜尋
    }
  });

function populateTable(data) {
  const tableBody = document.getElementById("studentTableBody");
  tableBody.innerHTML = ""; // 清空表格內容

  data.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${student.st_id}</td>
            <td>${student.st_name}</td>
            <td>${student.st_age}</td>
            <td>${student.st_phone1}</td>
            <td>${student.st_phone2}</td>
            <td>${student.st_email}</td>
            <td style="width: 142px;">
                <a class="btn btn-primary btn-action mr-1 return-btn" data-id="${student.st_id}"><i class="fas fa-undo-alt"></i></a>
            </td>
        `;
    tableBody.appendChild(row);
  });
  // 為每個編輯按鈕添加點擊事件
  document.querySelectorAll(".return-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const studentId = this.getAttribute("data-id");
      const studentData = data.find((student) => student.st_id == studentId);
      $("#st_id_return").text(studentData.st_id);
      $("#st_name_return").text(studentData.st_name);
      $("#returnStudentButton").click();
    });
  });
}

function searchTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const filteredData = leave_st_data.filter((student) => {
    return (
      student.st_id.toString().includes(input) ||
      student.st_name.toLowerCase().includes(input) ||
      student.st_phone1.includes(input) ||
      student.st_phone2.includes(input) ||
      student.st_email.includes(input)
    );
  });
  populateTable(filteredData); // 更新表格
}

document.addEventListener("DOMContentLoaded", function () {
  populateTable(leave_st_data);
});
