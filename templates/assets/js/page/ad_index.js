"use strict";

function clearInput() {
  document.getElementById('searchInput').value = ''; // 清空輸入框
  populateTable(st_data); // 恢復顯示所有學生資料
  toggleClearButton(); // 更新清除按鈕的顯示
}

// function toggleClearButton() {
//   const input = document.getElementById('searchInput').value;
//   const clearButton = document.getElementById('clearButton');
//   clearButton.style.display = input ? 'inline' : 'none'; // 根據輸入內容顯示或隱藏清除按鈕
// }

function populateTable(data) {
    const tableBody = document.getElementById('studentTableBody');
    tableBody.innerHTML = ''; // 清空表格內容

    data.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.st_id}</td>
            <td>${student.st_name}</td>
            <td>${student.st_parent}</td>
            <td>${student.st_phone1}</td>
            <td>${student.st_phone2}</td>
            <td style="width: 140px;">
                <a class="btn btn-primary btn-action mr-1"><i class="fas fa-pencil-alt"></i></a>
                <a class="btn btn-danger btn-action"><i class="fas fa-trash"></i></a>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function searchTable() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = st_data.filter(student => {
        return student.st_id.toString().includes(input) || 
               student.st_name.toLowerCase().includes(input) || 
               student.st_parent.toLowerCase().includes(input) || 
               student.st_phone1.includes(input) || 
               student.st_phone2.includes(input);
    });
    populateTable(filteredData); // 更新表格
}

document.addEventListener('DOMContentLoaded', function() {
    populateTable(st_data);
});
