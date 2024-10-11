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
        
        // 填充学生的相关信息
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
        
        // 清空教室下拉框的选项
        $('#st_classroom_name_forTr').empty();
        
        let currentClassroom = ''; // 用于追踪当前教室名称

        // 动态生成 select 选项
        course_data.forEach(classroom => {
            const classroomName = classroom.classroom_name; // 获取教室名称

            // 如果当前教室名称与上一个不同，插入一个新的 optgroup 作为教室名称标题
            if (classroomName !== currentClassroom) {
                $('#st_classroom_name_forTr').append(`<optgroup label="${classroomName}"></optgroup>`);
                currentClassroom = classroomName; // 更新当前教室名称
            }

            // 将教室时段添加到相应的教室名称标题下
            const selected = classroom.classtime_id === studentData.st_classtime_id ? 'selected' : ''; // 判断是否选中
            const fullDescription = `${classroomName} 星期${classroom.class_week} ${classroom.start_time} - ${classroom.end_time}`;
            $('#st_classroom_name_forTr optgroup[label="' + classroomName + '"]').append(`
                <option value="${classroom.classtime_id}" ${selected}>
                    ${fullDescription}
                </option>
            `);
        });

        // 更新老师下拉框的函数
        function updateTeacherOptions(classtimeId) {
            const trSelect = $('#st_tr_name_forTr'); // 选取老师的下拉框
            trSelect.empty(); // 先清空下拉框

            // 根据选中的时段找到对应的课程数据
            const selectedCourse = course_data.find(course => course.classtime_id === classtimeId);

            // 如果找到相应的时段，并且该时段有可用老师
            if (selectedCourse && selectedCourse.trs.length > 0) {
                selectedCourse.trs.forEach(teacher => {
                    // 检查课程 ID 条件
                    let isDisabled = false; // 默认可选
                    if (studentData.st_course_id > 10 && teacher.tr_course_id !== studentData.st_course_id) {
                        isDisabled = true; // 如果课程 ID > 10 且老师的课程 ID 不匹配，则禁用
                    }

                    const isSelected = teacher.tr_id === studentData.st_tr_id ? 'selected' : ''; // 判断是否为学生当前的老师
                    const disabledAttribute = isDisabled ? 'disabled' : ''; // 设置 disabled 属性
                    const optionClass = isDisabled ? 'class="text-muted"' : '';
                    const teacherName = isDisabled ? `${teacher.tr_name} (無法選擇)` : teacher.tr_name;

                    trSelect.append(`<option value="${teacher.tr_id}" ${isSelected} ${disabledAttribute} ${optionClass}>${teacherName}</option>`);
                });
            } else {
                // 如果没有老师，显示 "暂无可选老师"
                trSelect.append(`<option value="" disabled>暫無老師可以教學</option>`);
            }
        }

        // 监听课程时段选择的变化
        $('#st_classroom_name_forTr').on('change', function() {
            const selectedClasstimeId = $(this).val(); // 获取选中的时段 ID
            updateTeacherOptions(selectedClasstimeId);  // 更新对应的老师选项
        });

        // 页面加载时，根据学生当前的时段初始化老师选项
        const currentClasstimeId = studentData.st_classtime_id; // 学生当前的课程时段 ID
        updateTeacherOptions(currentClasstimeId);  // 初始化老师选项

        // 点击编辑按钮后显示编辑窗口
        $('#edit_st_scheduleButton').click();
    });
});

};



document.getElementById('searchStudentBtn').addEventListener('click', function() {
    const stId = document.getElementById('search_st_id').value.trim(); // 获取输入的学号并去掉前后空格

    // 清空之前的搜索结果
    document.getElementById('search_st_name').innerHTML = ''; // 清空显示的姓名

    // 如果输入为空，不发送请求
    if (!stId) {
        document.getElementById('search_st_name').innerHTML = '<span style="color: red">請輸入學號!</span>';
        return;
    }

    if (!Number.isInteger(Number(stId)) || Number(stId) < 0) {  // 检查是否为有效数字且为非负整数
        document.getElementById('search_st_name').innerHTML = '<span style="color: red">學號格式錯誤!</span>';
        return;
    }

    // 发起 AJAX 请求
    fetch('/search_st_info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ search_st_id: stId }), // 发送学号
    })
    .then(response => response.json()) // 将返回数据解析为 JSON
    .then(data => {
        // 更新页面上的学生信息
        document.getElementById('search_st_name').innerHTML = data.st_name || '<span style="color: red">查無此資料!</span>'; // 使用 innerHTML 处理 HTML 内容

        if (!data.st_name) {
            return; // 结束执行
        }

        console.log(data.st_course_id); // 打印课程ID到控制台

        // 动态填充上课时段的下拉框
        const classtimeSelect = $('#search_classtime_id');
        classtimeSelect.empty(); // 清空已有的选项
        // 重新添加默认选项
        classtimeSelect.append('<option value="" disabled selected>請選擇上課時段</option>'); // 添加默认选项


        let currentClassroom = ''; // 用于追踪当前教室名称

        // 根据 course_id 去比对 course_data
        course_data.forEach(classroom => {
            // 判断课程 ID 是否小于等于 10
            if (data.st_course_id <= 10) {
                const classroomName = classroom.classroom_name; // 获取教室名称

                // 如果当前教室名称与上一个不同，插入一个新的 optgroup 作为教室名称标题
                if (classroomName !== currentClassroom) {
                    classtimeSelect.append(`<optgroup label="${classroomName}"></optgroup>`);
                    currentClassroom = classroomName; // 更新当前教室名称
                }

                // 将教室时段添加到相应的教室名称标题下
                const option = `
                    <option value="${classroom.classtime_id}">
                        ${classroomName} 星期${classroom.class_week} ${classroom.start_time} - ${classroom.end_time}
                    </option>
                `;
                classtimeSelect.find(`optgroup[label="${classroomName}"]`).append(option); // 将选项添加到对应的 optgroup
                console.log('course_id: 10 以下，已添加课程：', option); // 打印调试信息



                // 动态填充老师下拉框
                const trSelect = $('#search_tr_id');
                trSelect.empty(); // 先清空下拉框
                trSelect.append('<option value="" disabled selected>請選擇授課老師</option>'); // 添加默认选项

                // 查找对应的老师
                const selectedCourse = classroom.trs; // 直接使用当前教室的老师
                console.log('selectedCourse', selectedCourse)
                console.log('classroom.trs', classroom.trs)
                
                if (selectedCourse && selectedCourse.length > 0) {
                    selectedCourse.forEach(tr => {
                        const option = `
                            <option value="${tr.tr_id}">
                                ${tr.tr_name}
                            </option>
                        `;
                        trSelect.append(option);
                        console.log('已添加老师：', tr.tr_name); // 打印调试信息
                    });
                } else {
                    console.log('此教室没有可用老师。'); // 如果没有老师，记录到控制台
                }

            } else { 
                // 判断课程是否包含对应的课程 ID
                if (classroom.trs.some(tr => tr.tr_course_id === data.st_course_id)) {
                    const classroomName = classroom.classroom_name; // 获取教室名称

                    // 如果当前教室名称与上一个不同，插入一个新的 optgroup 作为教室名称标题
                    if (classroomName !== currentClassroom) {
                        classtimeSelect.append(`<optgroup label="${classroomName}"></optgroup>`);
                        currentClassroom = classroomName; // 更新当前教室名称
                    }

                    // 将教室时段添加到相应的教室名称标题下
                    const option = `
                        <option value="${classroom.classtime_id}">
                            ${classroomName} 星期${classroom.class_week} ${classroom.start_time} - ${classroom.end_time}
                        </option>
                    `;
                    classtimeSelect.find(`optgroup[label="${classroomName}"]`).append(option); // 将选项添加到对应的 optgroup
                    console.log('course_id: 大於 10，已添加课程：', option); // 打印调试信息

                    // 动态填充老师下拉框
                    const trSelect = $('#search_tr_id');
                    trSelect.empty(); // 先清空下拉框
                    trSelect.append('<option value="" disabled selected>請選擇授課老師</option>'); // 添加默认选项

                    // 查找对应的老师
                    const selectedCourse = classroom.trs; // 直接使用当前教室的老师
                    console.log('selectedCourse', selectedCourse)
                    console.log('classroom.trs', classroom.trs)
                    
                    if (selectedCourse && selectedCourse.length > 0) {
                        selectedCourse.forEach(tr => {
                            // 判断是否可以选择老师
                            const isDisabled = data.st_course_id > 10 && tr.tr_course_id !== data.st_course_id; // 根据您的条件
                            const teacherName = isDisabled ? `${tr.tr_name} (無法選擇)` : tr.tr_name; // 如果不行则添加 (無法選擇)
                    
                            // 添加老师选项到下拉框，若不可选择则添加 class 和 disabled 属性
                            const option = `
                                <option value="${tr.tr_id}" ${isDisabled ? 'class="text-muted" disabled' : ''}>
                                    ${teacherName}
                                </option>
                            `;
                            trSelect.append(option);
                            console.log('已添加老师：', teacherName); // 打印调试信息
                        });
                    } else {
                        console.log('此教室没有可用老师。'); // 如果没有老师，记录到控制台
                    }
                }
            }
        });

        // 如果没有找到可选的课程时段，添加默认选项
        if (classtimeSelect.find('option').length === 0) {
            const option = `<option value="" disabled>無可選時段</option>`;
            classtimeSelect.append(option);
        }

        // 动态填充授课老师的下拉框
        // updateTeacherOptions(classtimeSelect.val()); // 根据当前选中的上课时段 ID 更新老师选项
    })
    .catch(error => {
        console.error('Error:', error); // 错误处理
        document.getElementById('search_st_name').innerHTML = '<span style="color: red">查詢出錯!</span>';
    });
});

// // 更新老师下拉框的函数
// function updateTeacherOptions(classtimeId) {
//     const trSelect = $('#search_tr_id'); // 选取老师的下拉框
//     trSelect.empty(); // 先清空下拉框

//     // 根据选中的时段找到对应的课程数据
//     const selectedCourse = course_data.find(course => course.classtime_id === classtimeId);
//     selectedCourse.trs.forEach(tr => {
//         // 直接添加老师选项到下拉框
//         const option = `
//             <option value="${tr.tr_id}">
//                 ${tr.tr_teacher_name}
//             </option>
//         `;
//         trSelect.append(option);
//         console.log('已添加老师：', tr.tr_teacher_name); // 打印调试信息
//     });

// }


// // 监听课程时段选择的变化
// $('#search_classtime_id').on('change', function() {
//     const selectedClasstimeId = $(this).val(); // 获取选中的时段 ID
//     console.log('selectedClasstimeId', selectedClasstimeId)
//     updateTeacherOptions(selectedClasstimeId);  // 更新对应的老师选项
// });

// // 页面加载时，确保下拉框的状态
// $(document).ready(function() {
//     const currentClasstimeId = $('#search_classtime_id').val(); // 获取当前选中的课程时段 ID
//     if (currentClasstimeId) {
//         updateTeacherOptions(currentClasstimeId);  // 初始化老师选项
//     }
// });





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


