"use strict";

function clearInput() {
  document.getElementById('searchInput').value = ''; // 清空輸入框
  populateTable(tr_data); // 恢復顯示所有學生資料
}

// 監聽輸入框的 Enter 鍵
document.getElementById('searchInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        searchTable(); // 當按下 Enter 鍵時觸發搜尋
    }
});


function populateTable(data) {
    const tableBody = document.getElementById('trTableBody');
    tableBody.innerHTML = ''; // 清空表格內容

    data.forEach(tr => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tr.user_id}</td>
            <td>${tr.tr_name}</td>
            <td>${tr.classroom_name}</td>
            <td>${"禮拜" + tr.class_week + " " + tr.start_time + "-" + tr.end_time}</td>
            <td>${tr.course_name}</td>
            <td style="width: 142px;">
                <a class="btn btn-primary btn-action mr-1 edit-btn" data-id="${tr.tr_id}"><i class="fas fa-pencil-alt"></i></a>
                <a class="btn btn-danger btn-action leave-btn" data-id="${tr.tr_id}"><i class="fas fa-share-square"></i></a>
            </td>
        `;
        tableBody.appendChild(row);
    });
 // 為每個編輯按鈕添加點擊事件
 document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
        // const trId = this.getAttribute('data-id');
        // const trData = data.find(tr => tr.st_id == trId);
        // $('#st_id_edit').text(trData.st_id); 
        // $('#st_acc_edit').val(trData.st_acc); 
        // $('#st_pwd_edit').val(trData.st_pwd); 
        // $('#st_name_edit').val(trData.st_name); 
        // $('#st_age_edit').val(trData.st_age); 
        // $('#st_address_edit').val(trData.st_address); 
        // $('#st_phone1_edit').val(trData.st_phone1); 
        // $('#st_phone2_edit').val(trData.st_phone2);
        // $('#st_email_edit').val(trData.st_email);
        // $('#st_picture_edit').attr('src', trData.st_picture);
        // $('#st_create_date_edit').val(moment(trData.st_create_date).format('YYYY-MM-DD'));
        // $('#st_workplace_edit').val(trData.st_workplace);
        // $('#st_profession_edit').val(trData.st_profession);
        // $('#st_parent_edit').val(trData.st_parent);
        // $('#st_tuition_edit').val(trData.st_tuition);
        // $('#st_pay_num_edit').val(trData.st_pay_num);
        // const currentCourseId = trData.st_course_id;
        // const currentCourseName = course_name_data.find(course => course.course_id === currentCourseId)?.name;
        // $('#st_course_name_edit').html(`
        //     <option value="" disabled>請選擇學習進度</option>
        //     ${course_name_data.map(course => 
        //       `<option value="${course.course_id}" ${course.course_id === currentCourseId ? 'selected' : ''}>${course.name}</option>`).join('')}
        //   `);

        // $('#st_note_edit').val(trData.st_note);
        // const textarea = document.getElementById('st_note_edit');

        // textarea.addEventListener('input', function () {
        //     // 設置高度並強制使用 !important
        //     this.setAttribute('style', `height: ${this.scrollHeight}px !important;`);
        // });
        $('#editTeacherButton').click();
    });
 });
    
 document.querySelectorAll('.leave-btn').forEach(button => {
    button.addEventListener('click', function() {
        // const trId = this.getAttribute('data-id');
        // const trData = data.find(tr => tr.st_id == trId);
        // $('#st_id_leave').text(trData.st_id); 
        // $('#st_name_leave').text(trData.st_name); 
        $('#leaveTeacherButton').click();
    });
});
}

function searchTable() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = tr_data.filter(tr => {
        return tr.st_id.toString().includes(input) || 
               tr.st_name.toLowerCase().includes(input) || 
               tr.st_parent.toLowerCase().includes(input) || 
               tr.st_phone1.includes(input) || 
               tr.st_phone2.includes(input);
    });
    populateTable(filteredData); // 更新表格
}

document.addEventListener('DOMContentLoaded', function() {
    populateTable(tr_data);
});
