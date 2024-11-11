"use strict";

let currentClassroom = ""; // 用于追踪当前教室名称
let classSchedule = [];

// 如果重新輸入學號要查詢時，隐藏上课时段和授课老师的 div
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("new_search_st_id").addEventListener("input", function () {
    $("#new_search_st_name").text("");
    $("#new_search_classtime_id").val("");
    $("#new_search_tr_id").val("");
    $("#new_search_date_start").val("");
    $("#new_currentSelection").text("");
    $("#new_currentSelection_val").val("");
    $("#new_old_classtime_id").val("");
    $("#new_search_st_info_msg").text("");
    $("#new_search_classtime_id").closest(".form-group").hide();
    $("#new_search_tr_id").closest(".form-group").hide();
    $("#new_search_date_start").closest(".form-group").hide();
    $("#new_st_schedule_info").hide();
  });
});

// 搜尋按鈕點擊
document
  .getElementById("new_searchStudentBtn")
  .addEventListener("click", function () {
    const stId = document.getElementById("new_search_st_id").value.trim(); // 获取输入的学号并去掉前后空格

    // 如果输入为空，不发送请求
    if (!validateInput(stId)) return;

    // 发起 AJAX 请求
    fetchStudentInfo(stId).then(updateStudentInfo).catch(handleError);
  });

// 验证输入函数
function validateInput(stId) {
  if (!stId) {
    document.getElementById("new_search_st_name").innerHTML =
      '<span style="color: red">請輸入學號!</span>';
    return false;
  }
  if (!Number.isInteger(Number(stId)) || Number(stId) < 0) {
    document.getElementById("new_search_st_name").innerHTML =
      '<span style="color: red">學號格式錯誤!</span>';
    return false;
  }
  return true;
}

// 发起 AJAX 请求的函数
function fetchStudentInfo(stId) {
  return fetch("/search_st_info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ search_st_id: stId }), // 发送学号
  }).then((response) => response.json());
}

// 更新学生信息的函数
function updateStudentInfo(data) {
  document.getElementById("new_search_st_name").innerHTML = data.st_name || "";
  // 學號格式不正確 or 非本期可安排的學生
  if (!data.st_name ||
    data.st_name === `<span style="color: red">查無資料!</span>` ||
    data.st_name === `<span style="color: red">該生本期剩餘可安排堂數為0!</span>` ||
    data.st_name === `<span style="color: red">請先完成繳費後在安排學生時段!</span>`) { 
    return;
  }

  if (data.st_name === `<span style="color: red">將扣掉一期費用以新增下期時段</span>` ||
    data.st_name === `<span style="color: red">第一次上課!</span>`
  ) {
    return;
  }
  else {  // 正常新增當期時段
    // 显示上课时段和授课老师的 div
    $("#new_search_classtime_id").closest(".form-group").show();
    $("#new_search_tr_id").closest(".form-group").show();
    $("#new_search_date_start").closest(".form-group").show();
    $("#new_st_schedule_info").show();
    const old_classtime_id = new Set();

    for (let i = 0; i < data.st_classtime_id.length; i++) {
      // 将组合转换为字符串并加入 Set
      old_classtime_id.add(`${data.st_classtime_id[i]} ${data.st_tr_id[i]}`);
    }
    // 将结果转换成数组，并赋值给元素
    $("#new_old_classtime_id").val(Array.from(old_classtime_id));
    document.getElementById("new_search_st_course_id").value = data.st_course_id;

    populateClasstimeSelect(data.st_course_id, data.st_classtime_id, data.st_start_time, data.st_end_time);
    currentClassroom = "";
  }
}

// 处理错误的函数
function handleError(error) {
  document.getElementById("new_search_st_name").innerHTML =
    // '<span style="color: red">查詢出錯!</span>';
    `<span style="color: red">`+ error + `</span>`;
}

// 将时间字符串转换为总秒数
function timeToSeconds(timeStr) {
  const [hours, minutes] = timeStr.toString().split(":").map(Number);
  return hours * 3600 + minutes * 60; // 转换为总秒数
}

// 动态填充上课时段的下拉框
function populateClasstimeSelect(studentCourseId, studentClasstimeId, studentStartTime, studentEndtTime) {
  const classtimeSelect = $("#new_search_classtime_id");
  const studentStartSeconds = timeToSeconds(studentStartTime);
  const studentEndSeconds = timeToSeconds(studentEndtTime);
  classtimeSelect
    .empty()
    .append('<option value="" disabled selected>請選擇上課時段</option>'); // 添加默认选项

  course_data.forEach((classroom) => {
    if (classroom.trs.length > 0) {
      if (studentCourseId <= 10) {
        const isSelected = studentClasstimeId.includes(classroom.classtime_id);
        const classroomStartSeconds = timeToSeconds(classroom.start_time);
        const classroomEndSeconds = timeToSeconds(classroom.end_time);
        const isConflict = (
          (studentStartSeconds < classroomEndSeconds) && 
          (studentEndSeconds > classroomStartSeconds)
        );
        addClassroomOptions(classroom, classtimeSelect, isSelected, isConflict);
      } else {
        const filteredTeachers = classroom.trs.filter(
          (tr) => tr.tr_course_id === studentCourseId
        );
        if (filteredTeachers.length > 0) {
          const isSelected = studentClasstimeId.includes(classroom.classtime_id);
          const classroomStartSeconds = timeToSeconds(classroom.start_time);
          const classroomEndSeconds = timeToSeconds(classroom.end_time);
          const isConflict = (
            (studentStartSeconds < classroomEndSeconds) && 
            (studentEndSeconds > classroomStartSeconds)
          );
          addClassroomOptions(classroom, classtimeSelect, isSelected, isConflict);
        }
      }
    }
  });

  // 如果没有找到可选的课程时段，添加默认选项
  if (classtimeSelect.find("option").length === 0) {
    classtimeSelect.append('<option value="" disabled>無可選時段</option>');
  }
}

// 添加课程时段选项的函数
function addClassroomOptions_edit(
  classroom,
  classtimeSelect,
  isSelected,
  currentClasstimeId
) {
  const classroomName = classroom.classroom_name;

  // 只在教室名称变化时添加 optgroup
  if (classroomName !== currentClassroom) {
    classtimeSelect.append(`<optgroup label="${classroomName}"></optgroup>`);
    currentClassroom = classroomName; // 更新当前教室名称
  }

  let option = "";
  if (currentClasstimeId == classroom.classtime_id) {
    option = `
    <option value="${classroom.classtime_id}" ${
      isSelected ? 'selected disabled="true" class="text-muted"' : ""
    }>
      ${classroomName} 星期${classroom.class_week} ${classroom.start_time} - ${
      classroom.end_time
    }
      ${isSelected ? "(已選擇)" : ""}
    </option>
  `;
  } else {
    option = `
    <option value="${classroom.classtime_id}" ${
      isSelected ? 'disabled="true" class="text-muted"' : ""
    }>
      ${classroomName} 星期${classroom.class_week} ${classroom.start_time} - ${
      classroom.end_time
    }
      ${isSelected ? "(已選擇)" : ""}
    </option>
  `;
  }

  classtimeSelect.find(`optgroup[label="${classroomName}"]`).append(option);

  // Populate teacher select only if needed
  populateTeacherSelect(classroom.trs);
}

function addClassroomOptions(classroom, classtimeSelect, isSelected, isConflict) {
  const classroomName = classroom.classroom_name;

  // 只在教室名称变化时添加 optgroup
  if (classroomName !== currentClassroom) {
    classtimeSelect.append(`<optgroup label="${classroomName}"></optgroup>`);
    currentClassroom = classroomName; // 更新当前教室名称
  }

  const option = `
    <option value="${classroom.classtime_id}" ${
      (isSelected || isConflict) ? 'disabled="true" class="text-muted"' : ""
    }>
      ${classroomName} 星期${classroom.class_week} ${classroom.start_time} - ${classroom.end_time}
      ${
        isSelected && isConflict ? "(已選擇)"
        : isConflict ? "(衝堂)"
        : isSelected ? "(已選擇)"
        : ""
      }
    </option>
  `;



  classtimeSelect.find(`optgroup[label="${classroomName}"]`).append(option);

  // Populate teacher select only if needed
  populateTeacherSelect(classroom.trs);
}

// 动态填充老师下拉框
function populateTeacherSelect(teachers) {
  const trSelect = $("#new_search_tr_id");
  trSelect
    .empty()
    .append('<option value="" disabled selected>請選擇授課老師</option>'); // 添加默认选项
}

// 监听课程时段选择的变化
$("#new_search_classtime_id").on("change", function () {
  const selectedClasstimeId = $(this).val(); // 获取选中的时段 ID
  const st_course_id = document.getElementById("#new_search_st_course_id").value;
  searchUpdateTeacherOptions(selectedClasstimeId, st_course_id); // 更新对应的老师选项
});

// 页面加载时，确保下拉框的状态
$(document).ready(function () {
  const currentClasstimeId = $("#new_search_classtime_id").val(); // 获取当前选中的课程时段 ID
  if (currentClasstimeId) {
    searchUpdateTeacherOptions(
      currentClasstimeId,
      document.getElementById("#new_search_st_course_id").value
    ); // 初始化老师选项
  }
});

function searchUpdateTeacherOptions(classtimeId, studentCourseId) {
  const trSelect = $("#new_search_tr_id"); // 选取老师的下拉框
  trSelect
    .empty()
    .append('<option value="" disabled selected>請選擇授課老師</option>'); // 添加默认选项

  // 查找与选中时段ID匹配的课程
  const selectedCourse = course_data.find(
    (course) => course.classtime_id == classtimeId
  );

  if (selectedCourse && selectedCourse.trs && selectedCourse.trs.length > 0) {
    selectedCourse.trs.forEach((tr) => {
      const isDisabled =
        studentCourseId > 10 && tr.tr_course_id != studentCourseId; // 判断老师是否符合条件

      const option = `
                <option value="${tr.tr_id}" ${
        isDisabled ? 'class="text-muted" disabled' : ""
      }>
                    ${tr.tr_name}${isDisabled ? " (無法選擇)" : ""}
                </option>
            `;
      trSelect.append(option);
    });
  }
}

