"use strict";

let currentClassroom = ""; // 用於追蹤當前教室名稱
let classSchedule = [];

function populateTable(data) {
  const tableBody = document.getElementById("studentTableBody");
  const semesterClassCount = new Map();
  tableBody.innerHTML = ""; // 清空表格內容

  data.forEach((student, index) => {
    const semesterKey = `${student.st_id}-${student.st_semester}`;
    const count = semesterClassCount.get(semesterKey) || 0;
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.st_semester}-${count + 1}</td>
            <td>${student.st_id}</td>
            <td>${student.st_name}</td>
            <td>${student.st_classroom_name}</td>
            <td>星期${student.st_week} ${student.st_start_time} - ${
      student.st_end_time
    }</td>
            <td>${student.st_tr_name}</td>
            <td style="width: 142px;">
                <a class="btn btn-primary btn-action mr-1 edit-btn" data-id="${
                  student.st_id
                } ${
      student.st_classtime_id
    }"><i class="fas fa-pencil-alt"></i></a>
                <a class="btn btn-danger btn-action leave-btn" data-id="${
                  student.st_id
                } ${
      student.st_classtime_id
    }"><i class="fas fas fa-trash"></i></a>
            </td>
        `;
    tableBody.appendChild(row);
    semesterClassCount.set(semesterKey, count + 1);
  });

  // 編輯學生按鈕
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const dataId = this.getAttribute("data-id");
      // 使用 split 將學號和時段 ID 分開
      const [studentId, studentClasstimeId] = dataId.split(" ");
      const studentData = data.find(
        (student) =>
          student.st_id == studentId &&
          student.st_classtime_id == studentClasstimeId
      );
      // 頁面載入時，根據學生當前的時段初始化老師選項
      const currentClasstimeId = studentData.st_classtime_id; // 學生當前的課程時段 ID
      const studentCourseId = studentData.st_course_id; // 學生當前的課程時段 ID
      const studentTrId = studentData.st_tr_id;
      updateTeacherOptions(currentClasstimeId, studentCourseId, studentTrId); // 初始化老師選項
      const classtimeSelect = $("#st_classroom_name_forTr");
      classtimeSelect
        .empty()
        .append('<option value="" selected disabled>請選擇上課時段</option>'); // 添加預設選項
      // 填充學生的相關資訊
      $("#st_id_forTr").text(studentData.st_id);
      $("#st_name_forTr").text(studentData.st_name);

      currentClassroom = ""; // 用於追蹤當前教室名稱
      // 動態生成 select 選項
      course_data.forEach((classroom) => {
        if (classroom.trs.length > 0) {
          if (studentCourseId <= 10) {
            const studentClasstimeId = st_data
              .filter((st) => st.st_id === studentData.st_id) // 篩選出符合 student_id 的項
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
            const filteredTeachers = classroom.trs.filter((tr) =>
              tr.tr_course_id.includes(studentCourseId)
            );

            if (filteredTeachers.length > 0) {
              const studentClasstimeId = st_data
                .filter((st) => st.st_id === studentData.st_id) // 篩選出符合 student_id 的項
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

      // 更新老師下拉清單的函數
      function updateTeacherOptions(classtimeId, studentCourseId, studentTrId) {
        const trSelect = $("#st_tr_name_forTr"); // 選取老師的下拉清單
        trSelect
          .empty()
          .append('<option value="" disabled selected>請選擇授課老師</option>'); // 添加預設選項

        // 查找與選中時段ID匹配的課程
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
              studentCourseId > 10 &&
              !tr.tr_course_id.includes(studentCourseId); // 判斷老師是否符合條件
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

      // 監聽課程時段選擇的變化
      $("#st_classroom_name_forTr").on("change", function () {
        const selectedClasstimeId = $(this).val(); // 獲取選中的時段 ID
        const studentCourseId = studentData.st_course_id; // 學生當前的課程時段 ID
        updateTeacherOptions(selectedClasstimeId, studentCourseId); // 更新對應的老師選項
      });

      // 點擊編輯按鈕後顯示編輯視窗
      $("#edit_st_scheduleButton").click();
    });
  });

  document.querySelectorAll(".leave-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const dataId = this.getAttribute("data-id");
      // 使用 split 將學號和時段 ID 分開
      const [studentId, studentClasstimeId] = dataId.split(" ");
      const studentData = data.find(
        (student) =>
          student.st_id == studentId &&
          student.st_classtime_id == studentClasstimeId
      );

      $("#semester_forTr_leave").val(studentData.st_semester);
      $("#st_id_forTr_leave").text(studentData.st_id);
      $("#st_name_forTr_leave").text(studentData.st_name);
      $("#st_tr_name_forTr_leave").val(studentData.st_tr_name);
      $("#classtime_id_forTr_leave").val(studentData.st_classtime_id);
      $("#st_classroom_name_forTr_leave").val(
        studentData.st_classroom_name +
          " 禮拜" +
          studentData.st_week +
          " " +
          studentData.st_start_time +
          "-" +
          studentData.st_end_time
      );

      // 點擊編輯按鈕後顯示編輯視窗
      $("#leave_st_scheduleButton").click();
    });
  });
}

// 點擊調整學生
document
  .getElementById("st_scheduleButton")
  .addEventListener("click", function () {
    $("#search_st_id").val("");
    $("#search_st_name").text("");
    $("#search_classtime_id").val("");
    $("#search_tr_id").val("");
    $("#currentSelection").val("");
    $("#currentSelection_val").val("");
    $("#old_classtime_id").val("");
    $("#search_st_info_msg").text("");
    $("#semester_range").text("");
    $("#search_semester").closest(".form-group").hide();
    $("#search_semester_start_date").closest(".form-group").hide();
    $("#search_classtime_id").closest(".form-group").hide();
    $("#search_tr_id").closest(".form-group").hide();
    $("#st_schedule_info").hide();
  });

// 如果重新輸入學號要查詢時，隱藏上課時段和授課老師的 div
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("search_st_id")
    .addEventListener("input", function () {
      $("#search_st_name").text("");
      $("#search_classtime_id").val("");
      $("#search_tr_id").val("");
      $("#currentSelection").text("");
      $("#currentSelection_val").val("");
      $("#old_classtime_id").val("");
      $("#search_st_info_msg").text("");
      $("#semester_range").text("");
      $("#search_semester").closest(".form-group").hide();
      $("#search_semester_start_date").closest(".form-group").hide();
      $("#search_classtime_id").closest(".form-group").hide();
      $("#search_tr_id").closest(".form-group").hide();
      $("#st_schedule_info").hide();
    });
});

// 搜尋按鈕點擊
document
  .getElementById("searchStudentBtn")
  .addEventListener("click", function () {
    const stId = document.getElementById("search_st_id").value.trim(); // 獲取輸入的學號並去掉前後空格

    // 如果輸入為空，不發送請求
    if (!validateInput(stId)) return;

    // 發起 AJAX 請求
    fetchStudentInfo(stId).then(updateStudentInfo).catch(handleError);
    $("#semester_range").text("學期範圍: ");
  });

// 驗證輸入函數
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

// 發起 AJAX 請求的函數
function fetchStudentInfo(stId) {
  return fetch("/search_st_info", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ search_st_id: stId }), // 發送學號
  }).then((response) => response.json());
}

document
  .getElementById("search_semester_start_date")
  .addEventListener("change", function () {
    let startDate = new Date(this.value);
    if (isNaN(startDate)) return;

    let endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 168);

    let formattedStartDate = startDate.toISOString().split("T")[0];
    let formattedEndDate = endDate.toISOString().split("T")[0];

    document.getElementById("semester_range").innerText =
      "學期範圍: " + formattedStartDate + " - " + formattedEndDate;
  });

// 更新學生資訊的函數
function updateStudentInfo(data) {
  document.getElementById("search_st_name").innerHTML = data.st_name || "";
  // 學號格式不正確 or 非本期可安排的學生
  if (
    !data.st_name ||
    data.st_name === `<span style="color: red">查無資料!</span>` ||
    data.st_name === `<span style="color: red">該生本期剩餘上課堂數為0!</span>`
  ) {
    return;
  }

  // 剛好上完或第一次排課
  if (data.first_time == true) {
    document.getElementById("search_st_name").innerHTML;
    let selectElement = document.getElementById("search_semester");

    // 建立新的 option
    let option = document.createElement("option");
    option.text = data.st_semester;
    option.value = "new";
    option.disabled = true;
    option.selected = true;
    // 添加到 select 元素中
    selectElement.add(option);

    $("#search_semester_start_date").closest(".form-group").show();
    $("#search_semester").closest(".form-group").show();
    $("#search_classtime_id").closest(".form-group").show();
    $("#search_tr_id").closest(".form-group").show();
    $("#search_date_start").closest(".form-group").show();
    $("#st_schedule_info").show();
    populateClasstimeSelect_new(data.st_course_id);
    currentClassroom = "";
  } else {
    // 正常新增當期時段
    // 顯示上課時段和授課老師的 div
    $("#search_semester").closest(".form-group").show();
    $("#search_classtime_id").closest(".form-group").show();
    $("#search_tr_id").closest(".form-group").show();
    $("#search_date_start").closest(".form-group").show();
    $("#st_schedule_info").show();
    $("#search_semester_start_date").closest(".form-group").hide();
    const old_classtime_id = new Set();

    $("#search_semester")
      .empty()
      .append(`<option value="" selected disabled>請選擇學期</option>`);
    for (let i of new Set(data.st_semester)) {
      $("#search_semester").append(`<option value="${i}">${i}</option>`);
    }
    if (data.pay_num > 0) {
      $("#search_semester").append(`<option value="new">新增下期</option>`);
    }

    document
      .getElementById("search_semester")
      .addEventListener("change", function () {
        if (this.value === "new") {
          $("#search_semester_start_date").closest(".form-group").show();
          $("#search_semester_start_date").val("");
          document.getElementById("semester_range").innerText = "學期範圍: ";
          // populateClasstimeSelect(data.st_course_id, data.st_classtime_id, data.st_start_time, data.st_end_time);
        } else {
          $("#search_semester_start_date").closest(".form-group").hide();
          let startDate = new Date(data.semester_start_date[this.value - 1]);
          let endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 168);
          let formattedStartDate = startDate.toISOString().split("T")[0];
          let formattedEndDate = endDate.toISOString().split("T")[0];
          document.getElementById("semester_range").innerText =
            "學期範圍: " + formattedStartDate + " - " + formattedEndDate;
        }
      });

    for (let i = 0; i < data.st_classtime_id.length; i++) {
      // 將組合轉換為字串並加入 Set
      old_classtime_id.add(`${data.st_classtime_id[i]} ${data.st_tr_id[i]}`);
    }
    // 將結果轉換成陣列，並賦值給元素
    $("#old_classtime_id").val(Array.from(old_classtime_id));
    document.getElementById("search_st_course_id").value = data.st_course_id;

    populateClasstimeSelect(
      data.st_course_id,
      data.st_classtime_id,
      data.st_class_week,
      data.st_start_time,
      data.st_end_time
    );
    currentClassroom = "";
  }
}

// 處理錯誤的函數
function handleError(error) {
  document.getElementById("search_st_name").innerHTML =
    // '<span style="color: red">查詢出錯!</span>';
    `<span style="color: red">` + error + `</span>`;
}

// 將時間字串轉換為總秒數
function timeToSeconds(timeStr) {
  const [hours, minutes] = timeStr.toString().split(":").map(Number);
  return hours * 3600 + minutes * 60; // 轉換為總秒數
}

// 動態填充上課時段的下拉清單
function populateClasstimeSelect(
  studentCourseId,
  studentClasstimeId,
  studentClassWeek,
  studentStartTime,
  studentEndtTime
) {
  console.log(
    "studentClasstimeIdlllllllll",
    studentClassWeek,
    studentStartTime
  );
  const classtimeSelect = $("#search_classtime_id");
  const studentStartSeconds = timeToSeconds(studentStartTime);
  const studentEndSeconds = timeToSeconds(studentEndtTime);
  $("#search_semester").on("change", function () {
    classtimeSelect
      .empty()
      .append('<option value="" disabled selected>請選擇上課時段</option>'); // 添加預設選項
  });

  course_data.forEach((classroom) => {
    if (classroom.trs.length > 0) {
      if (studentCourseId <= 10) {
        const isSelected = studentClasstimeId.includes(classroom.classtime_id);
        const classroomStartSeconds = timeToSeconds(classroom.start_time);
        const classroomEndSeconds = timeToSeconds(classroom.end_time);
        const isConflict =
          studentStartSeconds < classroomEndSeconds &&
          studentEndSeconds > classroomStartSeconds &&
          studentClassWeek.includes(classroom.class_week);
        console.log("week", studentClassWeek, classroom.class_week);
        addClassroomOptions(classroom, classtimeSelect, isSelected, isConflict);
      } else {
        const filteredTeachers = classroom.trs.filter((tr) =>
          tr.tr_course_id.includes(studentCourseId)
        );
        if (filteredTeachers.length > 0) {
          const isSelected = studentClasstimeId.includes(
            classroom.classtime_id
          );
          const classroomStartSeconds = timeToSeconds(classroom.start_time);
          const classroomEndSeconds = timeToSeconds(classroom.end_time);
          const isConflict =
            studentStartSeconds < classroomEndSeconds &&
            studentEndSeconds > classroomStartSeconds &&
            studentClassWeek.includes(classroom.class_week);
          console.log("week", studentClassWeek, classroom.class_week);
          addClassroomOptions(
            classroom,
            classtimeSelect,
            isSelected,
            isConflict
          );
        }
      }
    }
  });

  // 如果沒有找到可選的課程時段，添加預設選項
  if (classtimeSelect.find("option").length === 0) {
    classtimeSelect.append('<option value="" disabled>無可選時段</option>');
  }
}

function populateClasstimeSelect_new(studentCourseId) {
  const classtimeSelect = $("#search_classtime_id");

  classtimeSelect
    .empty()
    .append('<option value="" disabled selected>請選擇上課時段</option>'); // 添加預設選項

  course_data.forEach((classroom) => {
    if (classroom.trs.length > 0) {
      if (studentCourseId <= 10) {
        addClassroomOptions_new(classroom, classtimeSelect);
      } else {
        const filteredTeachers = classroom.trs.filter((tr) =>
          tr.tr_course_id.includes(studentCourseId)
        );
        if (filteredTeachers.length > 0) {
          addClassroomOptions_new(classroom, classtimeSelect);
        }
      }
    }
  });

  // 如果沒有找到可選的課程時段，添加預設選項
  if (classtimeSelect.find("option").length === 0) {
    classtimeSelect.append('<option value="" disabled>無可選時段</option>');
  }
}

// 添加課程時段選項的函數
function addClassroomOptions_edit(
  classroom,
  classtimeSelect,
  isSelected,
  currentClasstimeId
) {
  const classroomName = classroom.classroom_name;
  console.log("classroom", classroom);
  console.log("classtimeSelect", classtimeSelect);
  console.log("isSelected", isSelected);
  console.log("currentClasstimeId", currentClasstimeId);

  // 只在教室名稱變化時添加 optgroup
  if (classroomName !== currentClassroom) {
    classtimeSelect.append(`<optgroup label="${classroomName}"></optgroup>`);
    currentClassroom = classroomName; // 更新當前教室名稱
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

function addClassroomOptions(
  classroom,
  classtimeSelect,
  isSelected,
  isConflict
) {
  let option;
  $("#search_semester").on("change", function () {
    const classroomName = classroom.classroom_name;
    // classtimeSelect
    //   .empty()
    //   .append('<option value="" selected>請選擇上課時段</option>'); // 添加預設選項

    // 只在教室名稱變化時添加 optgroup
    if (classroomName !== currentClassroom) {
      classtimeSelect.append(`<optgroup label="${classroomName}"></optgroup>`);
      currentClassroom = classroomName; // 更新當前教室名稱
    }

    if (this.value != "new") {
      // 當學期不是 'new' 時，某些選項會被禁用
      option = `
        <option value="${classroom.classtime_id}" ${
        isSelected || isConflict ? 'disabled="true" class="text-muted"' : ""
      }>
          ${classroomName} 星期${classroom.class_week} ${
        classroom.start_time
      } - ${classroom.end_time}
          ${
            isSelected && isConflict
              ? "(已選擇)"
              : isConflict
              ? "(衝堂)"
              : isSelected
              ? "(已選擇)"
              : ""
          }
        </option>
      `;
    } else {
      // 如果是新學期，所有選項都可以選擇
      option = `
        <option value="${classroom.classtime_id}">
          ${classroomName} 星期${classroom.class_week} ${classroom.start_time} - ${classroom.end_time}
        </option>
      `;
    }
    classtimeSelect.find(`optgroup[label="${classroomName}"]`).append(option);
    // Populate teacher select only if needed
    populateTeacherSelect(classroom.trs);
  });
}

function addClassroomOptions_new(classroom, classtimeSelect) {
  let option;
  const classroomName = classroom.classroom_name;

  // 只在教室名稱變化時添加 optgroup
  if (classroomName !== currentClassroom) {
    classtimeSelect.append(`<optgroup label="${classroomName}"></optgroup>`);
    currentClassroom = classroomName; // 更新當前教室名稱
  }

  // 如果是新學期，所有選項都可以選擇
  option = `
        <option value="${classroom.classtime_id}">
          ${classroomName} 星期${classroom.class_week} ${classroom.start_time} - ${classroom.end_time}
        </option>
      `;
  classtimeSelect.find(`optgroup[label="${classroomName}"]`).append(option);
  // Populate teacher select only if needed
  populateTeacherSelect(classroom.trs);
}

// 動態填充老師下拉清單
function populateTeacherSelect(teachers) {
  const trSelect = $("#search_tr_id");
  trSelect
    .empty()
    .append('<option value="" disabled selected>請選擇授課老師</option>'); // 添加預設選項
}

// 監聽課程時段選擇的變化
$("#search_classtime_id").on("change", function () {
  const selectedClasstimeId = $(this).val(); // 獲取選中的時段 ID
  const st_course_id = document.getElementById("search_st_course_id").value;
  searchUpdateTeacherOptions(selectedClasstimeId, st_course_id); // 更新對應的老師選項
  console.log(
    "selectedClasstimeId",
    selectedClasstimeId,
    "st_course_id",
    st_course_id
  );
});

function searchUpdateTeacherOptions(classtimeId, studentCourseId) {
  const trSelect = $("#search_tr_id"); // 選取老師的下拉清單
  trSelect
    .empty()
    .append('<option value="" disabled selected>請選擇授課老師</option>'); // 添加預設選項

  // 查找與選中時段ID匹配的課程
  const selectedCourse = course_data.find(
    (course) => course.classtime_id == classtimeId
  );
  console.log("selectedCourse", selectedCourse);

  if (selectedCourse && selectedCourse.trs && selectedCourse.trs.length > 0) {
    selectedCourse.trs.forEach((tr) => {
      const isDisabled =
        studentCourseId > 10 && !tr.tr_course_id.includes(studentCourseId); // 判斷老師是否符合條件

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

// 新增表格
document.addEventListener("DOMContentLoaded", function () {
  populateTable(st_data);
});

// 點 X 清除搜尋框文字
function clearInput() {
  document.getElementById("searchInput").value = ""; // 清空輸入框
  populateTable(st_data); // 恢復顯示所有學生資料
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
