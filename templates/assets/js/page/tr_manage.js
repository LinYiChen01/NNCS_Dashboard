"use strict";

function clearInput() {
  document.getElementById("searchInput").value = ""; // 清空輸入框
  populateTable(tr_data); // 恢復顯示所有學生資料
}

// 監聽輸入框的 Enter 鍵
document
  .getElementById("searchInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      searchTable(); // 當按下 Enter 鍵時觸發搜尋
    }
  });

function populateTable(data, data2) {
  const tableBody = document.getElementById("trTableBody");
  tableBody.innerHTML = ""; // 清空表格內容

  data.forEach((tr, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${index + 1}</td>
            <td>${tr.tr_name}</td>
            <td>${tr.classroom_name}</td>
            <td>${
              "禮拜" + tr.class_week + " " + tr.start_time + "-" + tr.end_time
            }</td>
            <td>${tr.course_name}</td>
            <td style="width: 142px;">
                <a class="btn btn-primary btn-action mr-1 edit-btn" data-id="${
                  tr.tr_id
                } ${tr.user_id}"><i class="fas fa-pencil-alt"></i></a>
                <a class="btn btn-danger btn-action leave-btn" data-id="${
                  tr.tr_id
                } ${tr.user_id}"><i class="fas fas fas fa-trash"></i></a>
            </td>
        `;
    tableBody.appendChild(row);
  });
  // 為每個編輯按鈕添加點擊事件
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const dataID = this.getAttribute("data-id").split(" ");
      const trID = dataID[0];
      const userID = dataID[1];
      const trData = data.find((tr) => tr.user_id == userID);
      $("#tr_pwd_edit").hide();
      $("#tr_id_edit").text(trData.user_id);
      $("#tr_name_edit").val(trData.tr_name);
      $("#tr_course_name_choose").text("已選授課項目：" + trData.course_name);
      $("#tr_course_val_choose").val(trData.course_id);
      $("#tr_classtime_st_num_edit").text(
        trData.classroom_name +
          " " +
          "禮拜" +
          trData.class_week +
          " " +
          trData.start_time +
          "-" +
          trData.end_time +
          " " +
          "可接納學生數"
      );
      $("#tr_classtime_edit").val(trData.classtime_id);

      for (let option of document.getElementById("tr_st_num").options) {
        if (option.value == trData.st_num) {
          option.selected = true; // 如果 option 的值和 st_num 匹配，則選中它
        }
      }

      const trInfo = data2.find((tr) => tr.user_id == userID);
      $("#tr_acc_edit").val(trInfo.tr_acc);
      $("#tr_pwd_reset").click(function () {
        $("#tr_pwd_edit").show(); // Show the password reset field
      });

      $("#tr_age_edit").val(trInfo.tr_age);
      $("#tr_address_edit").val(trInfo.tr_address);
      $("#tr_phone1_edit").val(trInfo.tr_phone1);
      $("#tr_phone2_edit").val(trInfo.tr_phone2);
      $("#tr_email_edit").val(trInfo.tr_email);
      $("#tr_picture_edit").attr("src", trInfo.tr_picture);
      $("#tr_create_date_edit").val(
        moment(trInfo.tr_create_date).format("YYYY-MM-DD")
      );

      $("#editTeacherButton").click();
    });
  });

  document.querySelectorAll(".leave-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const trId = this.getAttribute("data-id").split(" ")[0];
      const trData = data.find((tr) => tr.tr_id == trId);
      $("#clsstime_id_leave_input").val(trData.classtime_id);
      $("#classtroom_leave").text(trData.classroom_name);
      $("#classtime_leave").text(
        "禮拜" +
          trData.class_week +
          " " +
          trData.start_time +
          "-" +
          trData.end_time
      );
      $("#tr_name_leave").text(trData.tr_name);
      $("#st_num").val(trData.have_st);
      $("#leave_tr_error_msg").text("");
      $("#tr_id_leave_input").val(trData.tr_id);
      $("#leaveTeacherButton").click();
    });
  });
}

function searchTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const filteredData = tr_data.filter((tr) => {
    return (
      tr.user_id.toString() == input ||
      tr.tr_name.toLowerCase().includes(input) ||
      tr.classtime_id.toString() == input
    );
  });
  // 提取 filteredData 中的 user_id 列表
  const filteredUserIds = filteredData.map((tr) => tr.user_id);
  // 篩選 filteredData2，根據 filteredUserIds 中的 user_id
  const filteredData2 = tr_info.filter((tr) =>
    filteredUserIds.includes(tr.user_id)
  );
  populateTable(filteredData, filteredData2); // 更新表格
}

document.addEventListener("DOMContentLoaded", function () {
  populateTable(tr_data, tr_info);
});

// 為新增按鈕添加點擊事件
document.getElementById("add-course-btn").addEventListener("click", () => {
  const selectedCourseId = $("#tr_course_name_edit").val();
  const selectedCourseName = $("#tr_course_name_edit option:selected").text();
  if (
    !$("#tr_course_val_choose").val().includes(selectedCourseId) &&
    selectedCourseId
  ) {
    if ($("#tr_course_name_choose").text() == "已選授課項目：") {
      $("#tr_course_name_choose").text(
        $("#tr_course_name_choose").text() + selectedCourseName
      );
      $("#tr_course_val_choose").val(
        $("#tr_course_val_choose").val() + selectedCourseId
      );
    } else {
      $("#tr_course_name_choose").text(
        $("#tr_course_name_choose").text() + ", " + selectedCourseName
      );
      $("#tr_course_val_choose").val(
        $("#tr_course_val_choose").val() + "," + selectedCourseId
      );
    }
    $("#tr_course_name_edit").val("");
  }
});

document
  .getElementById("add_course_btn_insert")
  .addEventListener("click", () => {
    const selectedCourseId = $("#tr_course_name_insert").val();
    const selectedCourseName = $(
      "#tr_course_name_insert option:selected"
    ).text();
    if (
      !$("#tr_course_val_choose_insert").val().includes(selectedCourseId) &&
      selectedCourseId
    ) {
      if ($("#tr_course_name_choose_insert").text() == "已選授課項目：") {
        $("#tr_course_name_choose_insert").text(
          $("#tr_course_name_choose_insert").text() + selectedCourseName
        );
        $("#tr_course_val_choose_insert").val(
          $("#tr_course_val_choose_insert").val() + selectedCourseId
        );
      } else {
        $("#tr_course_name_choose_insert").text(
          $("#tr_course_name_choose_insert").text() + ", " + selectedCourseName
        );
        $("#tr_course_val_choose_insert").val(
          $("#tr_course_val_choose_insert").val() + "," + selectedCourseId
        );
      }
      $("#tr_course_name_insert").val("");
    }
  });

document.getElementById("tr_insertDataButton").addEventListener("click", () => {
  $("#tr_classtime_choose_insert").text("已選授課時段：");
  $("#tr_classtimeid_choose_insert").val("");
  let currentClassroom = "";

  classtime_data.forEach((classroom) => {
    const classroomName = classroom.classroom_name;

    // 如果教室名稱發生變化，創建新的 <optgroup>
    if (classroomName !== currentClassroom) {
      $("#tr_classtime_id").append(
        `<optgroup label="${classroomName}"></optgroup>`
      );
      currentClassroom = classroomName; // 更新當前教室名稱
    }

    // 創建選項
    const option = `
        <option value="${classroom.classtime_id}">${classroom.classroom_schedule}</option>
    `;

    // 將選項追加到最後一個 <optgroup> 中
    $("#tr_classtime_id")
      .find(`optgroup[label="${classroomName}"]`)
      .append(option);
  });
});

document.getElementById("tr_insetTimeButton").addEventListener("click", () => {
  $("#search_classtime_id").closest(".form-group").hide();
  $("#tr_classtime_st_num_insert").closest(".form-group").hide();
  $("#st_schedule_info").hide();
  $("#tr_classtime_choose_search").hide();
  $("#tr_classtime_choose_search").text("已選授課時段：");
  $("#tr_classtimeid_choose_search").val("");
});

document
  .getElementById("searchTeacherBtn")
  .addEventListener("click", function () {
    const trId = document.getElementById("search_tr_id").value.trim(); // 獲取輸入的學號並去掉前後空格
    // 如果輸入為空，不發送請求
    if (!trId) {
      document.getElementById("search_tr_name").innerHTML =
        '<span style="color: red">請輸入教師編號!</span>';
      return;
    }
    if (!Number.isInteger(Number(trId)) || Number(trId) < 0) {
      document.getElementById("search_tr_name").innerHTML =
        '<span style="color: red">教師編號格式錯誤!</span>';
      return;
    }

    // 發起 AJAX 請求
    fetchTeacherInfo(trId);
  });

function fetchTeacherInfo(trId) {
  // 發起 AJAX 請求
  fetch("/searchTeacher", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tr_id: trId }), // 將資料轉為 JSON 格式
  })
    .then((response) => {
      if (response.ok) {
        return response.json(); // 將回應轉換為 JSON
      }
    })
    .then((data) => {
      document.getElementById("search_tr_name").innerHTML = data.tr_name;
      if (data.tr_name !== `<span style="color: red">查無資料!</span>`) {
        $("#search_classtime_id")
          .empty()
          .append('<option value="" selected disabled>請選擇授課時段</option>');
        $("#search_classtime_id").closest(".form-group").show();
        $("#tr_classtime_st_num_insert").closest(".form-group").show();
        $("#st_schedule_info").show();
        $("#tr_classtime_choose_search").show();
        $("#tr_classtime_choose_search").text("已選授課時段：");
        $("#tr_classtimeid_choose_search").val("");

        let currentClassroom = "";
        const trData = tr_data.filter((tr) => tr.user_id == trId);
        const trClasstimeIds = trData.map((tr) => tr.classtime_id);
        const trSchedules = trData.map((tr) => ({
          week: tr.class_week,
          start_time: tr.start_time,
          end_time: tr.end_time,
        }));

        classtime_data.forEach((classroom) => {
          const classroomName = classroom.classroom_name;
          const schedule = classroom.classroom_schedule.split(" ")[1];
          const class_week = schedule.substr(2, 1);
          const [start, end] = schedule.split("-");
          const start_time = start.slice(3); // 提取開始時間
          const end_time = end; // 提取結束時間

          const isSelected = trClasstimeIds.includes(classroom.classtime_id);
          let isConflicted = false;

          // 沖堂判定
          for (const i of trSchedules) {
            if (
              class_week === i.week && // 同一星期
              start_time < i.end_time &&
              end_time > i.start_time // 時間衝突條件
            ) {
              isConflicted = true;
              break; // 一旦發現衝突，立即退出迴圈
            }
          }

          // 如果教室名稱發生變化，創建新的 <optgroup>
          if (classroomName !== currentClassroom) {
            $("#search_classtime_id").append(
              `<optgroup label="${classroomName}"></optgroup>`
            );
            currentClassroom = classroomName; // 更新當前教室名稱
          }

          // 創建選項
          const option = `
                    <option value="${classroom.classtime_id}" 
                        ${
                          isSelected || isConflicted
                            ? 'class="text-muted" disabled'
                            : ""
                        }>
                        ${classroom.classroom_schedule} 
                        ${
                          isSelected ? "(已選擇)" : isConflicted ? "(衝堂)" : ""
                        }
                    </option>

                `;

          // 將選項追加到最後一個 <optgroup> 中
          $("#search_classtime_id")
            .find(`optgroup[label="${classroomName}"]`)
            .append(option);
        });
      }
    })
    .catch((error) => {
      document.getElementById("search_tr_name").innerHTML =
        '<span style="color: red>查無資料!</span>';
    });
}

// 添加監聽器，當 search_tr_id 內容變化時隱藏相關元素
document.getElementById("search_tr_id").addEventListener("input", function () {
  // 隱藏指定內容
  document.getElementById("search_tr_name").innerHTML = "";
  $("#search_classtime_id").closest(".form-group").hide();
  $("#tr_classtime_st_num_insert").closest(".form-group").hide();
  $("#st_schedule_info").hide();
  $("#tr_classtime_choose_search").hide();
});

document.getElementById("add_tr_classtime_id").addEventListener("click", () => {
  const selectedClasstimeId = $("#tr_classtime_id").val();
  const selectedClasstime = $("#tr_classtime_id option:selected").text();

  if (
    !selectedClasstimeId ||
    $("#tr_classtimeid_choose_insert").val().includes(selectedClasstimeId)
  ) {
    return; // 如果未選擇或已選過，直接返回
  }

  // 更新隱藏的輸入框
  if ($("#tr_classtime_choose_insert").text() === "已選授課時段：") {
    $("#tr_classtimeid_choose_insert").val(selectedClasstimeId);
  } else {
    $("#tr_classtimeid_choose_insert").val(
      $("#tr_classtimeid_choose_insert").val() + "," + selectedClasstimeId
    );
  }

  // 更新顯示已選課程時段
  $("#tr_classtime_choose_insert").css("display", "block");
  $("#tr_classtime_choose_insert").html(
    $("#tr_classtime_choose_insert").html() + "<br>" + selectedClasstime
  );

  // 解析選中課程的時間範圍
  const schedule = selectedClasstime.split(" ")[1]; // e.g., "禮拜三19:00-20:00"
  const class_week = schedule.substr(0, 3);
  const [start, end] = schedule.split("-");
  const start_time = start.slice(3); // 截取時間部分
  const end_time = end;

  // 禁用衝突的選項
  classtime_data.forEach((i) => {
    const i_schedule = i.classroom_schedule.split(" ")[1];
    const i_class_week = i_schedule.substr(0, 3);
    const [i_start, i_end] = i_schedule.split("-");
    const i_start_time = i_start.slice(3);
    const i_end_time = i_end;

    // 判斷是否衝突
    if (
      class_week === i_class_week &&
      start_time < i_end_time &&
      end_time > i_start_time // 時間段有交集
    ) {
      $(`#tr_classtime_id option[value="${i.classtime_id}"]`)
        .prop("disabled", true)
        .text(i.classroom_schedule + " (衝堂)")
        .addClass("text-muted");
    }
  });

  // 禁用已選擇的選項，並標記為“已選擇”
  $("#tr_classtime_id option:selected")
    .prop("disabled", true)
    .text(selectedClasstime + " (已選擇)");

  // 清空下拉式功能表選擇
  $("#tr_classtime_id").val("");
});

document
  .getElementById("tr_insetTimeButton_search")
  .addEventListener("click", () => {
    const selectedClasstimeId = $("#search_classtime_id").val();
    const selectedClasstime = $("#search_classtime_id option:selected").text();

    if (
      !selectedClasstimeId ||
      $("#tr_classtimeid_choose_search").val().includes(selectedClasstimeId)
    ) {
      return; // 如果未選擇或已選過，直接返回
    }

    // 更新隱藏的輸入框
    if ($("#tr_classtime_choose_search").text() === "已選授課時段：") {
      $("#tr_classtimeid_choose_search").val(selectedClasstimeId);
    } else {
      $("#tr_classtimeid_choose_search").val(
        $("#tr_classtimeid_choose_search").val() + "," + selectedClasstimeId
      );
    }

    // 更新顯示已選課程時段
    $("#tr_classtime_choose_search").css("display", "block");
    $("#tr_classtime_choose_search").html(
      $("#tr_classtime_choose_search").html() + "<br>" + selectedClasstime
    );

    // 解析選中課程的時間範圍
    const schedule = selectedClasstime.split(" ")[1]; // e.g., "禮拜三19:00-20:00"
    const class_week = schedule.substr(0, 3);
    const [start, end] = schedule.split("-");
    const start_time = start.slice(3); // 截取時間部分
    const end_time = end;

    // 禁用衝突的選項
    classtime_data.forEach((i) => {
      const i_schedule = i.classroom_schedule.split(" ")[1];
      const i_class_week = i_schedule.substr(0, 3);
      const [i_start, i_end] = i_schedule.split("-");
      const i_start_time = i_start.slice(3);
      const i_end_time = i_end;

      // 判斷是否衝突
      if (
        class_week === i_class_week &&
        start_time < i_end_time &&
        end_time > i_start_time // 時間段有交集
      ) {
        $(`#search_classtime_id option[value="${i.classtime_id}"]`)
          .prop("disabled", true)
          .text(i.classroom_schedule + " (衝堂)")
          .addClass("text-muted");
      }
    });

    // 禁用已選擇的選項，並標記為“已選擇”
    $("#search_classtime_id option:selected")
      .prop("disabled", true)
      .text(selectedClasstime + " (已選擇)");

    // 清空下拉式功能表選擇
    $("#search_classtime_id").val("");
  });
