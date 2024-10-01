"use strict";

function clearInput() {
  document.getElementById('searchInput').value = ''; // 清空輸入框
  populateTable(st_data); // 恢復顯示所有學生資料
  toggleClearButton(); // 更新清除按鈕的顯示
}

// 監聽輸入框的 Enter 鍵
document.getElementById('searchInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        searchTable(); // 當按下 Enter 鍵時觸發搜尋
    }
});


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
                <a class="btn btn-primary btn-action mr-1 edit-btn" data-id="${student.st_id}"><i class="fas fa-pencil-alt"></i></a>
                <a class="btn btn-danger btn-action"><i class="fas fa-trash"></i></a>
            </td>
        `;
        tableBody.appendChild(row);
    });
 // 為每個編輯按鈕添加點擊事件
 document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
        const studentId = this.getAttribute('data-id');
        const studentData = data.find(student => student.st_id == studentId);

        // 將學生數據填入模態表單
        // document.getElementById('studentName').value = studentData.st_name;
        // document.getElementById('parentName').value = studentData.st_parent;
        // document.getElementById('phone1').value = studentData.st_phone1;
        // document.getElementById('phone2').value = studentData.st_phone2;

        // 顯示模態視窗
        $('#a').val(studentData.st_id);
        $('#editStudentModal').click();
    });
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
