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


function populateTable(data, data2) {
    const tableBody = document.getElementById('trTableBody');
    tableBody.innerHTML = ''; // 清空表格內容

    data.forEach((tr, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${tr.tr_name}</td>
            <td>${tr.classroom_name}</td>
            <td>${"禮拜" + tr.class_week + " " + tr.start_time + "-" + tr.end_time}</td>
            <td>${tr.course_name}</td>
            <td style="width: 142px;">
                <a class="btn btn-primary btn-action mr-1 edit-btn" data-id="${tr.tr_id} ${tr.user_id}"><i class="fas fa-pencil-alt"></i></a>
                <a class="btn btn-danger btn-action leave-btn" data-id="${tr.tr_id} ${tr.user_id}"><i class="fas fas fas fa-trash"></i></a>
            </td>
        `;
        tableBody.appendChild(row);
    });
 // 為每個編輯按鈕添加點擊事件
 document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
        const dataID = this.getAttribute('data-id').split(" ");
        const trID = dataID[0];
        const userID = dataID[1];

        const trData = data.find(tr => tr.user_id == userID);
        $('#tr_id_edit').text(trData.user_id); 
        $('#tr_name_edit').val(trData.tr_name); 
        $('#tr_course_name_choose').text('已選授課項目：' + trData.course_name);
        $('#tr_course_val_choose').val(trData.course_id);
        $('#tr_classtime_st_num_edit').text(trData.classroom_name + ' ' + "禮拜" + trData.class_week + " " + trData.start_time + "-" + trData.end_time);
        $('#tr_classtime_edit').val(trData.classtime_id);

        for (let option of document.getElementById('tr_st_num').options) {
            if (option.value == trData.st_num) {
              option.selected = true;  // 如果 option 的值和 st_num 匹配，则选中它
            } 
          }
        
        const trInfo = data2.find(tr => tr.user_id == userID);
        $('#tr_acc_edit').val(trInfo.tr_acc); 
        $('#tr_pwd_edit').val(trInfo.tr_pwd); 
        $('#tr_age_edit').val(trInfo.tr_age); 
        $('#tr_address_edit').val(trInfo.tr_address); 
        $('#tr_phone1_edit').val(trInfo.tr_phone1); 
        $('#tr_phone2_edit').val(trInfo.tr_phone2);
        $('#tr_email_edit').val(trInfo.tr_email);
        $('#tr_picture_edit').attr('src', trInfo.tr_picture);
        $('#tr_create_date_edit').val(moment(trInfo.tr_create_date).format('YYYY-MM-DD'));
        
        
        $('#editTeacherButton').click();
    });
 });
    
 document.querySelectorAll('.leave-btn').forEach(button => {
    button.addEventListener('click', function() {
        const trId = this.getAttribute('data-id').split(" ")[0];
        const trData = data.find(tr => tr.tr_id == trId);
        $('#clsstime_id_leave_input').val(trData.classtime_id); 
        $('#classtroom_leave').text(trData.classroom_name); 
        $('#classtime_leave').text("禮拜"+trData.class_week+" "+trData.start_time+"-"+trData.end_time); 
        $('#tr_name_leave').text(trData.tr_name); 
        $('#st_num').val(trData.have_st); 
        $("#leave_tr_error_msg").text("");   
        $("#tr_id_leave_input").val(trData.tr_id)
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
    populateTable(tr_data, tr_info);
});


// 为新增按钮添加点击事件
document.getElementById('add-course-btn').addEventListener('click', () => {
    const selectedCourseId = $('#tr_course_name_edit').val();
    const selectedCourseName = $('#tr_course_name_edit option:selected').text();
    if (!$('#tr_course_val_choose').val().includes(selectedCourseId) && selectedCourseId) { 
        if ($('#tr_course_name_choose').text() == '已選授課項目：') {
            $('#tr_course_name_choose').text($('#tr_course_name_choose').text() + selectedCourseName);
            $('#tr_course_val_choose').val($('#tr_course_val_choose').val() + selectedCourseId); 
        }
        else { 
            $('#tr_course_name_choose').text($('#tr_course_name_choose').text() + ', ' + selectedCourseName);
            $('#tr_course_val_choose').val($('#tr_course_val_choose').val() + ',' + selectedCourseId); 
        }   
        $('#tr_course_name_edit').val("");
    }
});


document.getElementById('add_course_btn_insert').addEventListener('click', () => {
    const selectedCourseId = $('#tr_course_name_insert').val();
    const selectedCourseName = $('#tr_course_name_insert option:selected').text();
    if (!$('#tr_course_val_choose_insert').val().includes(selectedCourseId) && selectedCourseId) { 
        if ($('#tr_course_name_choose_insert').text() == '已選授課項目：') {
            $('#tr_course_name_choose_insert').text($('#tr_course_name_choose_insert').text() + selectedCourseName);
            $('#tr_course_val_choose_insert').val($('#tr_course_val_choose_insert').val() + selectedCourseId); 
        }
        else { 
            $('#tr_course_name_choose_insert').text($('#tr_course_name_choose_insert').text() + ', ' + selectedCourseName);
            $('#tr_course_val_choose_insert').val($('#tr_course_val_choose_insert').val() + ',' + selectedCourseId); 
        }
        $('#tr_course_name_insert').val("");
        
    }
});


let currentClassroom = "";
document.getElementById('tr_insertDataButton').addEventListener('click', () => {
    classtime_data.forEach((classroom) => {
    const classroomName = classroom.classroom_name;

    // 如果教室名称发生变化，创建新的 <optgroup>
    if (classroomName !== currentClassroom) {
        $("#tr_classtime_id").append(`<optgroup label="${classroomName}"></optgroup>`);
        currentClassroom = classroomName; // 更新当前教室名称
    }

    // 创建选项
    const option = `
        <option value="${classroom.classtime_id}">${classroom.classroom_schedule}</option>
    `;

    // 将选项追加到最后一个 <optgroup> 中
    $("#tr_classtime_id").find(`optgroup[label="${classroomName}"]`).append(option);
    });
});

document.getElementById('add_tr_classtime_id').addEventListener('click', () => {
    const selectedClasstimeId = $('#tr_classtime_id').val();   
    const selectedClasstime = $('#tr_classtime_id option:selected').text();
    if (!$('#tr_classtimeid_choose_insert').val().includes(selectedClasstimeId) && selectedClasstimeId) { 
        if ($('#tr_classtime_choose_insert').text() == '已選授課時段：') {
            $('#tr_classtimeid_choose_insert').val($('#tr_classtimeid_choose_insert').val() + selectedClasstimeId); 
        }
        else { 
            $('#tr_classtimeid_choose_insert').val($('#tr_classtimeid_choose_insert').val() + ',' + selectedClasstimeId); 
        }
        $('#tr_classtime_choose_insert').css('display', 'block');
            $('#tr_classtime_choose_insert').html(
                $('#tr_classtime_choose_insert').html() + '<br>' + selectedClasstime
            );   
    }
    $('#tr_classtime_id').val("");
});

