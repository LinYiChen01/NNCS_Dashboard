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
            <td>${student.st_classroom_name}</td>
            <td>星期${student.st_week} ${student.st_start_time} - ${student.st_end_time}</td>
            <td>${student.st_tr_name}</td>
            <td style="width: 100px;">
                <a class="btn btn-primary btn-action mr-1 edit-btn" data-id="${student.st_id}"><i class="fas fa-pencil-alt"></i></a>
            </td>
        `;
        tableBody.appendChild(row);
    });
 // 為每個編輯按鈕添加點擊事件
 document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
        const studentId = this.getAttribute('data-id');
        const studentData = data.find(student => student.st_id == studentId);
        $('#st_id_forTr').text(studentData.st_id);
        $('#st_name_forTr').text(studentData.st_name);
        $('#tr_id_forTr').val(studentData.st_tr_id);
        $('#tr_name_forTr').val(studentData.st_tr_name);
        $('#classtime_id_forTr').val(studentData.st_classtime_id);
        $('#st_classroom_name_forTr').val(studentData.st_classroom_name);
        $('#start_time_forTr').val(studentData.st_start_time.slice(0, -3));
        $('#end_time_forTr').val(studentData.st_end_time.slice(0, -3));
        $('#course_id_forTr').val(studentData.st_course_id);
        $('#course_name_forTr').val(studentData.st_course_name);
        
        // 清空 select 的选项
        $('#st_classroom_name_forTr').empty();
        
        

        // 动态生成 select 选项
        course_data.forEach(classroom => {
            const selected = classroom.classtime_id === studentData.st_classtime_id ? 'selected' : '';  // 判断是否选中
            $('#st_classroom_name_forTr').append(`
                <option value="${classroom.classtime_id}" ${selected}>${classroom.classroom_name+"&nbsp;&nbsp;星期"+classroom.class_week +"&nbsp;&nbsp;"+ classroom.start_time + "&nbsp;-&nbsp;" + classroom.end_time}</option>
            `);
        });


        $('#edit_st_scheduleButton').click();
    });
 });
}

function searchTable() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = st_data.filter(student => {
        return student.st_id.toString().includes(input) ||
               student.st_name.toLowerCase().includes(input) ||
               student.st_tr_id.toString().includes(input) ||
               student.st_tr_name.toLowerCase().includes(input) ||
               student.st_classtime_id.toString().includes(input) ||
               student.st_classroom_name.toLowerCase().includes(input);
    });
    populateTable(filteredData); // 更新表格
}

document.addEventListener('DOMContentLoaded', function() {
    populateTable(st_data);
});


