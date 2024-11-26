"use strict";

function clearInput() {
  document.getElementById('searchInput').value = ''; // 清空輸入框
  const tableBody = document.getElementById('studentTableBody');
  tableBody.innerHTML = ''; // 清空表格內容
}

// 監聽輸入框的 Enter 鍵
document.getElementById('searchInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        searchTable(); // 當按下 Enter 鍵時觸發搜尋
    }
});

function searchTable() {
    const input = document.getElementById('searchInput').value.toLowerCase();

    // 通过 AJAX 向后端发送请求
    $.ajax({
        url: '/search_st_attend', // 替换为你的后端 API 路径
        method: 'POST', // 假设是 POST 请求
        contentType: 'application/json',
        data: JSON.stringify({ data: input }),
        success: function(response) {
            // 更新表格
            // console.log('response', response);
            populateTable(response);
        },
        error: function(xhr, status, error) {
            console.error('查询失败:', error);
            // alert('查询失败，请稍后再试');
        }
    });
}

function populateTable(data) {
    const tableBody = document.getElementById('studentTableBody');
    tableBody.innerHTML = ''; // 清空表格內容

    data.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${moment(student.class_date).format('YYYY-MM-DD')}</td>
            <td>${student.classroom_name}</td>
            <td>${"禮拜 " + student.class_week + " " + student.start_time + "-" + student.end_time}</td>
            <td>${student.course_name + "-" + student.progress}</td>
            <td>${student.tr_name}</td>
            <td>${student.status}</td>
            <td style="width: 100px;">
                <a class="btn btn-primary btn-action mr-1 edit-btn" data-id="${student.attend_id}"><i class="fas fa-pencil-alt"></i></a>
            </td>
        `;
        tableBody.appendChild(row);
    });
 // 為每個編輯按鈕添加點擊事件
 document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
        const attendId = this.getAttribute('data-id');
        const studentData = data.find(student => student.attend_id == attendId);
        $('#st_id_attend').text(studentData.st_id); 
        $('#st_name_attend').text(studentData.st_name); 
        $('#st_date_attend').text(studentData.st_id); 
        $('#st_classroom_attend').text(moment(studentData.class_date).format('YYYY-MM-DD')); 
        $('#st_classtime_attend').text("禮拜 " + studentData.class_week + " " + studentData.start_time + "-" + studentData.end_time); 
        $('#st_tr_attend').text(studentData.tr_name); 
        if (studentData.course_id != "") {
            // 选择对应课程 ID 作为默认值
            $('#st_course_attend').val(studentData.course_id);
        } else {
            // 设置默认值为 "請選擇課程"
            $('#st_course_attend').val("");
        }
        
        // 动态生成课程列表
        $('#st_course_attend').append(
            course_data
                .map((c) => `<option value="${c.course_id}">${c.course_name}</option>`)
                .join("")
        );
        
        $('#st_last_problem_attend').val(studentData.progress); 
        $('#st_problems_attend').val(studentData.problems); 
        $('#st_attend_id').val(studentData.attend_id); 
        
        $('#editStudentAttendButton').click();
    });
 });
    
 document.querySelectorAll('.leave-btn').forEach(button => {
    button.addEventListener('click', function() {
        const studentId = this.getAttribute('data-id');
        const studentData = data.find(student => student.st_id == studentId);
        $('#st_id_leave').text(studentData.st_id); 
        $('#st_name_leave').text(studentData.st_name); 
        $('#leaveStudentButton').click();
    });
});
}

