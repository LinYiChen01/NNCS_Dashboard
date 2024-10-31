"use strict";

let currentClassroom = ""; // 用于追踪当前教室名称
let classSchedule = [];

function populateTable(data) {
  const tableBody = document.getElementById("studentTableBody");
  tableBody.innerHTML = ""; // 清空表格內容

  data.forEach((student, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.st_id}</td>
            <td>${student.st_name}</td>
            <td>${student.st_classroom_name}</td>
            <td>星期${student.st_week} ${student.st_start_time} - ${
      student.st_end_time
    }</td>
            <td>${student.st_tr_name}</td>
            <td style="width: 100px;">
                <a class="btn btn-primary btn-action mr-1 edit-btn" data-id="${
                  student.st_id
                } ${
      student.st_classtime_id
    }"><i class="fas fa-pencil-alt"></i></a>
            </td>
        `;
    tableBody.appendChild(row);
  });
  // 編輯學生按鈕
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const dataId = this.getAttribute("data-id");
      // 使用 split 将学号和时段 ID 分开
      const [studentId, studentClasstimeId] = dataId.split(" ");
      const studentData = data.find(
        (student) =>
          student.st_id == studentId &&
          student.st_classtime_id == studentClasstimeId
      );
      // 页面加载时，根据学生当前的时段初始化老师选项
      const currentClasstimeId = studentData.st_classtime_id; // 学生当前的课程时段 ID
      const studentCourseId = studentData.st_course_id; // 学生当前的课程时段 ID
      const studentTrId = studentData.st_tr_id;
      updateTeacherOptions(currentClasstimeId, studentCourseId, studentTrId); // 初始化老师选项
      const classtimeSelect = $("#st_classroom_name_forTr");
      classtimeSelect
        .empty()
        .append('<option value="" selected>請選擇上課時段</option>'); // 添加默认选项
      // 填充学生的相关信息
      $("#st_id_forTr").text(studentData.st_id);
      $("#st_name_forTr").text(studentData.st_name);
      $("#tr_id_forTr").val(studentData.st_tr_id);
      $("#tr_name_forTr").val(studentData.st_tr_name);
      $("#classtime_id_forTr").val(studentData.st_classtime_id);
      $("#st_classroom_name_forTr").val(studentData.st_classroom_name);
      $("#start_time_forTr").val(studentData.st_start_time.slice(0, -3));
      $("#end_time_forTr").val(studentData.st_end_time.slice(0, -3));
      $("#course_id_forTr").val(studentData.st_course_id);
      $("#course_name_forTr").val(studentData.st_course_name);
      $("#st_classroom_id_forTr").val(studentData.st_classtime_id);

      // 清空教室下拉框的选项
      // $("#st_classroom_name_forTr").empty();

      currentClassroom = ""; // 用于追踪当前教室名称

      // 动态生成 select 选项
      course_data.forEach((classroom) => {
        if (classroom.trs.length > 0) {
          if (studentCourseId <= 10) {
            const studentClasstimeId = st_data
              .filter((st) => st.st_id === studentData.st_id) // 筛选出符合 student_id 的项
              .map((st) => st.st_classtime_id); // 提取所有 st_classtime_id
            const isSelected = studentClasstimeId.includes(
              classroom.classtime_id
            );
            addClassroomOptions_edit(
              classroom,
              classtimeSelect,
              isSelected,
              currentClasstimeId
            );
          } else {
            const filteredTeachers = classroom.trs.filter(
              (tr) => tr.tr_course_id === studentCourseId
            );
            if (filteredTeachers.length > 0) {
              const studentClasstimeId = st_data
                .filter((st) => st.st_id === studentData.st_id) // 筛选出符合 student_id 的项
                .map((st) => st.st_classtime_id); // 提取所有 st_classtime_id
              const isSelected = studentClasstimeId.includes(
                classroom.classtime_id
              );
              addClassroomOptions_edit(
                classroom,
                classtimeSelect,
                isSelected,
                currentClasstimeId
              );
            }
          }
        }
      });
      // $("#st_classroom_name_forTr").val(studentData.st_classroom_name);

      // 更新老师下拉框的函数
      function updateTeacherOptions(classtimeId, studentCourseId, studentTrId) {
        const trSelect = $("#st_tr_name_forTr"); // 选取老师的下拉框
        trSelect
          .empty()
          .append('<option value="" disabled selected>請選擇授課老師</option>'); // 添加默认选项

        // 查找与选中时段ID匹配的课程
        const selectedCourse = course_data.find(
          (course) => course.classtime_id == classtimeId
        );

        if (
          selectedCourse &&
          selectedCourse.trs &&
          selectedCourse.trs.length > 0
        ) {
          selectedCourse.trs.forEach((tr) => {
            const isDisabled =
              studentCourseId > 10 && tr.tr_course_id != studentCourseId; // 判断老师是否符合条件
            const isSelected = studentTrId == tr.tr_id;
            const option = `
                <option value="${tr.tr_id}" ${isSelected ? "selected" : ""}  ${
              isDisabled ? 'class="text-muted" disabled' : ""
            }>
                    ${tr.tr_name}${isDisabled ? " (無法選擇)" : ""}
                </option>
            `;
            trSelect.append(option);
          });
        }
      }

      // 监听课程时段选择的变化
      $("#st_classroom_name_forTr").on("change", function () {
        const selectedClasstimeId = $(this).val(); // 获取选中的时段 ID
        const studentCourseId = studentData.st_course_id; // 学生当前的课程时段 ID
        updateTeacherOptions(selectedClasstimeId, studentCourseId); // 更新对应的老师选项
      });

      // 点击编辑按钮后显示编辑窗口
      $("#edit_st_scheduleButton").click();
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  populateTable(st_data);
});

// 安排學生
// 一開始尚未查詢成功時，隐藏上课时段和授课老师的 div
document.addEventListener("DOMContentLoaded", function () {
  $("#search_classtime_id").closest(".form-group").hide(); // 隐藏上课时段的 div
  $("#search_tr_id").closest(".form-group").hide(); // 隐藏授课老师的 div
});

// 如果重新輸入學號要查詢時，隐藏上课时段和授课老师的 div
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("search_st_id").addEventListener("input", function () {
    $("#search_st_name").html(""); // 清空姓名显示
    $("#search_classtime_id").closest(".form-group").hide(); // 隐藏上课时段的 div
    $("#search_tr_id").closest(".form-group").hide(); // 隐藏授课老师的 div
    $("#currentSelection").html(""); // 清空当前选择
    $("#currentSelection_val").html(""); // 清空当前选择
  });
});

// 安排學生按鈕被點擊
document
  .getElementById("searchStudentBtn")
  .addEventListener("click", function () {
    const stId = document.getElementById("search_st_id").value.trim(); // 获取输入的学号并去掉前后空格
    // 清空之前的搜索结果
    clearSearchResults();

    // 如果输入为空，不发送请求
    if (!validateInput(stId)) return;

    // 发起 AJAX 请求
    fetchStudentInfo(stId).then(updateStudentInfo).catch(handleError);
  });

// 清空搜索结果的函数
function clearSearchResults() {
  document.getElementById("search_st_name").innerHTML = ""; // 清空显示的姓名
  $("#search_classtime_id").closest(".form-group").hide(); // 隐藏上课时段的 div
  $("#search_tr_id").closest(".form-group").hide(); // 隐藏授课老师的 div
  $("#search_classtime_id")
    .empty()
    .append('<option value="" disabled selected>請選擇上課時段</option>'); // 清空上课时段选项
  $("#search_tr_id")
    .empty()
    .append('<option value="" disabled selected>請選擇授課老師</option>'); // 清空老师选项
}

// 验证输入函数
function validateInput(stId) {
  if (!stId) {
    document.getElementById("search_st_name").innerHTML =
      '<span style="color: red">請輸入學號!</span>';
    return false;
  }
  if (!Number.isInteger(Number(stId)) || Number(stId) < 0) {
    document.getElementById("search_st_name").innerHTML =
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
  document.getElementById("search_st_name").innerHTML = data.st_name || "";

  if (
    !data.st_name ||
    data.st_name === `<span style="color: red">查無資料!</span>`
  ) {
    return; // 如果没有找到学生信息，结束执行
  }

  // 显示上课时段和授课老师的 div
  $("#search_classtime_id").closest(".form-group").show();
  $("#search_tr_id").closest(".form-group").show();
  document.getElementById("search_st_course_id").value = data.st_course_id;


  populateClasstimeSelect(data.st_course_id, data.st_classtime_id);
  currentClassroom = "";
}

// 处理错误的函数
function handleError(error) {
  document.getElementById("search_st_name").innerHTML =
    '<span style="color: red">查詢出錯!</span>';
}

// 动态填充上课时段的下拉框
function populateClasstimeSelect(studentCourseId, studentClasstimeId) {
  const classtimeSelect = $("#search_classtime_id");
  classtimeSelect
    .empty()
    .append('<option value="" disabled selected>請選擇上課時段</option>'); // 添加默认选项

  course_data.forEach((classroom) => {
    if (classroom.trs.length > 0) {
      if (studentCourseId <= 10) {
        const isSelected = studentClasstimeId.includes(classroom.classtime_id);
        addClassroomOptions(classroom, classtimeSelect, isSelected);
      } else {
        const filteredTeachers = classroom.trs.filter(
          (tr) => tr.tr_course_id === studentCourseId
        );
        if (filteredTeachers.length > 0) {
          const isSelected = studentClasstimeId.includes(
            classroom.classtime_id
          );
          addClassroomOptions(classroom, classtimeSelect, isSelected);
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

function addClassroomOptions(classroom, classtimeSelect, isSelected) {
  const classroomName = classroom.classroom_name;

  // 只在教室名称变化时添加 optgroup
  if (classroomName !== currentClassroom) {
    classtimeSelect.append(`<optgroup label="${classroomName}"></optgroup>`);
    currentClassroom = classroomName; // 更新当前教室名称
  }

  const option = `
    <option value="${classroom.classtime_id}" ${
    isSelected ? 'disabled="true" class="text-muted"' : ""
  }>
      ${classroomName} 星期${classroom.class_week} ${classroom.start_time} - ${
    classroom.end_time
  }
      ${isSelected ? "(已選擇)" : ""}
    </option>
  `;

  classtimeSelect.find(`optgroup[label="${classroomName}"]`).append(option);

  // Populate teacher select only if needed
  populateTeacherSelect(classroom.trs);
}

// 动态填充老师下拉框
function populateTeacherSelect(teachers) {
  const trSelect = $("#search_tr_id");
  trSelect
    .empty()
    .append('<option value="" disabled selected>請選擇授課老師</option>'); // 添加默认选项
}

// 监听课程时段选择的变化
$("#search_classtime_id").on("change", function () {
  const selectedClasstimeId = $(this).val(); // 获取选中的时段 ID
  const st_course_id = document.getElementById("search_st_course_id").value;
  searchUpdateTeacherOptions(selectedClasstimeId, st_course_id); // 更新对应的老师选项
});

// 页面加载时，确保下拉框的状态
$(document).ready(function () {
  const currentClasstimeId = $("#search_classtime_id").val(); // 获取当前选中的课程时段 ID
  if (currentClasstimeId) {
    searchUpdateTeacherOptions(
      currentClasstimeId,
      document.getElementById("search_st_course_id").value
    ); // 初始化老师选项
  }
});

function searchUpdateTeacherOptions(classtimeId, studentCourseId) {
  const trSelect = $("#search_tr_id"); // 选取老师的下拉框
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


document.addEventListener("DOMContentLoaded", function() {
  document
    .getElementById("addClassTime")
    .addEventListener("click", function () {
      const classtime = $("#search_classtime_id option:selected").val();
      const teacher = $("#search_tr_id option:selected").val();
      if (classtime !== "" && teacher !== "") { 
        classSchedule.push([parseInt(classtime), teacher]);
        console.log(classSchedule);
        $("#search_classtime_id").val("");
        $("#search_tr_id").val("")
      }
     
    });
});


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
function searchTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const filteredData = st_data.filter((student) => {
    return (
      student.st_id.toString().includes(input) ||
      student.st_name.toLowerCase().includes(input) ||
      student.st_tr_id.toString().includes(input) ||
      student.st_tr_name.toLowerCase().includes(input) ||
      student.st_classtime_id.toString().includes(input) ||
      student.st_classroom_name.toLowerCase().includes(input)
    );
  });
  populateTable(filteredData); // 更新表格
}
