"use strict";

// 先清空表單再顯示視窗
$("#leaveButton").on("click", function () {
  clearForm();
});

// leaveButton Modal
$("#leaveButton").fireModal({
  title: "請假",
  body: `
    <form id="leaveForm" method="POST" action="/leaveButton">
      <div class="form-group">
        <label for="leaveDate">開始日期</label>
        <input type="date" class="form-control" id="leaveDate" name="leaveDate">
      </div>
      <div class="form-group">
        <label for="endDate">結束日期</label>
        <input type="date" class="form-control" id="endDate" name="endDate">
      </div>
    </form>
    <div id="leaveMessage"></div>
  `,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary",
      handler: function (modal) {
        // 當用戶點擊取消按鈕時，關閉模態並清空內容
        modal.modal("hide");
      },
    },
    {
      text: "確認請假",
      class: "btn btn-danger",
      handler: function (modal) {
        const leaveDate = $("#leaveDate").val();
        const endDate = $("#endDate").val();
        const today = new Date(); // 今天的日期
        today.setHours(0, 0, 0, 0); // 將時間部分設置為 0，確保只比較日期部分

        // 檢查是否有空的欄位
        if (!leaveDate || !endDate) {
          $("#leaveMessage").html(
            '<span style="color:red;">開始日期與結束日期不能為空！</span>'
          );
          return;
        }

        const leaveDateObj = moment(leaveDate); // 使用 moment 解析開始日期
        const endDateObj = moment(endDate); // 使用 moment 解析結束日期

        // 檢查開始日期和結束日期是否大於今天（不含今天）
        if (leaveDateObj <= today || endDateObj <= today) {
          $("#leaveMessage").html(
            `<span style="color:red;">請假日期只能是${moment(today).format(
              "YYYY-MM-DD"
            )}以後！</span>`
          );
          return;
        }

        // 檢查結束日期是否早於開始日期
        if (endDateObj < leaveDateObj) {
          $("#leaveMessage").html(
            '<span style="color:red;">結束日期不能早於開始日期！</span>'
          );
          return;
        }

        // 如果通過所有檢查，提交表單
        $("#leaveForm").submit();
      },
    },
  ],
});

// 每次模態關閉後清空表單內容
$(document).on("hide.bs.modal", "#leaveModal", function () {
  clearForm();
});

// 清空表單內容函式
function clearForm() {
  $("#leaveDate").val(""); // 清空開始日期
  $("#endDate").val(""); // 清空結束日期
  $("#leaveMessage").html(""); // 清空訊息
}

// 先清空表單再顯示視窗
$("#scheduleButton").on("click", function () {
  clearScheduleForm();
  // 延遲顯示模態視窗，以確保清空表單操作完成
});

// 只在index的時候作用
if (window.location.pathname === "/index") {
  // scheduleButton Modal
  $("#scheduleButton").fireModal({
    title: "排課",
    body: `
    <form id="scheduleForm" method="POST" action="/scheduleButton">
      <div class="form-group">
        <label for="classroomAreaSelect">上課地點</label>
        <select class="form-control" id="classroomAreaSelect" name="classroomAreaSelect">
          <option value="" disabled selected>請選擇上課地點</option>
          ${classroom_area
            .map((c) => `<option value="${c}">${c}</option>`)
            .join("")}
        </select>
      </div>
      <div class="form-group" id="classroomSelectGroup">
        <label for="classroomSelect">上課教室</label>
        <select class="form-control" id="classroomSelect" name="classroomSelect">
        </select>
      </div>
      <div class="form-group" id="classDateSelectGroup">
        <label for="classDate">開始上課日期</label>
        <input type="date" class="form-control" id="classDate" name="classDate">
        </input>
      </div>
      <div class="form-group" id="timeslotSelectGroup">
        <label for="timeslotSelect">上課時段</label>
        <select class="form-control" id="timeslotSelect" name="timeslotSelect">
        </select>
      </div>
      <div class="form-group" id="classNumSelectGroup">
        <label for="classNumSelect">上課堂數</label>
        <select class="form-control" id="classNumSelect" name="classNumSelect">
          <option value="" disabled selected>請選擇上課堂數</option>
          <option value="${20 - sc_class_num}">補完剩下堂數</option>
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="12">12</option>
          <option value="16">16</option>
        </select>
      </div>
    </form>
    <div id="scheduleMessage"></div>
    `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          // 當用戶點擊取消按鈕時，關閉模態並清空內容
          modal.modal("hide");
        },
      },
      {
        text: "確認",
        class: "btn btn-btn btn-primary",
        handler: function (modal) {
          const classroomAreaSelect = $("#classroomAreaSelect").val();
          const classroomSelect = $("#classroomSelect").val();
          const timeslotSelect = $("#timeslotSelect").val();
          var classNumSelect = $("#classNumSelect").val();
          if (classNumSelect === "補完剩下堂數") {
            classNumSelect = 20 - sc_class_num; // 使用剩下的課堂數
          }

          // 檢查是否有空的欄位
          if (
            !classroomAreaSelect ||
            !classroomSelect ||
            !timeslotSelect ||
            !classNumSelect
          ) {
            $("#scheduleMessage").html(
              '<span style="color:red;">請選擇完整的排課資料</span>'
            );
            return;
          } else {
            if (sc_class_num < 20) {
              if (parseInt(classNumSelect) + sc_class_num <= 20) {
                $("#scheduleForm").submit();
              } else {
                $("#scheduleMessage").html(
                  `<span style="color:red;">您目前安排上課堂數為${sc_class_num}堂，剩下${
                    20 - sc_class_num
                  }堂可以安排上課!${classNumSelect}</span>`
                );
                return;
              }
            } else {
              $("#scheduleMessage").html(
                `<span style="color:red;">您所安排的課程已超過上課次數20堂!</span>`
              );
              return;
            }
          }
        },
      },
    ],
  });
}

// Show classrooms only when a location is selected
$("#classroomAreaSelect").on("change", function () {
  const selectedArea = $(this).val();

  if (selectedArea) {
    // Filter classrooms based on the selected area
    const filteredClassrooms = [
      ...new Set(
        classroom_data
          .filter((item) => item.classroom.startsWith(selectedArea))
          .map((item) => item.classroom)
      ),
    ]; // Extract unique classroom names

    $("#classroomSelect")
      .empty()
      .append(`<option value="" disabled selected>請選擇教室</option>`)
      .append(
        filteredClassrooms.map((c) => `<option value="${c}">${c}</option>`)
      );

    // Show classroom select
    $("#classroomSelectGroup").show();

    // Reset timeslot options
    $("#timeslotSelect").html(
      '<option value="" disabled selected>請選擇上課時段</option>'
    );
    $("#classDateSelectGroup").hide();
    $("#timeslotSelectGroup").hide();
    $("#classNumSelectGroup").hide();
  } else {
    // Hide classroom select and timeslot select
    $("#classroomSelectGroup").hide();
    $("#classDateSelectGroup").hide();
    $("#timeslotSelectGroup").hide();
    $("#classNumSelectGroup").hide();
  }
});

// When the classroom is selected
$("#classroomSelect").on("change", function () {
  const selectedClassroom = $(this).val();
  console.log("Selected Classroom:", selectedClassroom);

  if (selectedClassroom) {
    $("#classDateSelectGroup").show();
    $("#timeslotSelectGroup").hide();
    $("#classNumSelectGroup").hide();
  } else {
    // Hide the timeslot select group if no classroom is selected
    $("#classDateSelectGroup").hide();
    $("#timeslotSelectGroup").hide();
    $("#classNumSelectGroup").hide();
  }
});

$("#classDate").on("change", function () {
  const selectedDate = moment($(this).val()); // 使用 Moment.js 解析所選日期
  const today = moment().startOf("day"); // 獲取今天的日期並設置為開始時間

  console.log("selectedDate", selectedDate.format("YYYY-MM-DD")); // 日誌顯示所選日期
  console.log("today", today.format("YYYY-MM-DD")); // 日誌顯示今天的日期

  // 檢查所選日期是否小於或等於今天
  if (selectedDate.isSameOrBefore(today)) {
    $("#scheduleMessage").html(
      '<span style="color:red;">日期不能是今天或過去的日期</span>'
    );
    $("#classNumSelectGroup").hide();
    $("#timeslotSelectGroup").hide();
    return;
  } else if (selectedDate.isAfter(moment(end_class_date))) {
    $("#scheduleMessage").html(
      `<span style="color:red;">日期不能超過${moment(end_class_date).format(
        "YYYY-MM-DD"
      )}</span>`
    );
    $("#classNumSelectGroup").hide();
    $("#timeslotSelectGroup").hide();
    return;
  } else {
    $("#scheduleMessage").html(""); // 清空錯誤信息
  }

  const selectedWeekday = selectedDate.isoWeekday(); // 使用 isoWeekday() 獲取 ISO 周的星期幾
  const weekdaysMap = ["一", "二", "三", "四", "五", "六", "日"];

  // 篩選並顯示對應的時段
  // 篩選並顯示對應的時段
  const classTimes = classroom_data
    .filter((item) => {
      return (
        weekdaysMap[selectedWeekday - 1] === item.class_week &&
        item.classroom === $("#classroomSelect").val()
      );
    })
    .map((item) => {
      return {
        time: `星期${item.class_week} ${item.start_time}-${item.end_time}`,
        startTime: item.start_time,
      };
    })
    .sort((a, b) => {
      return a.startTime.localeCompare(b.startTime); // 使用字串比對
    });

  if (classTimes.length > 0) {
    $("#timeslotSelect")
      .empty()
      .append('<option value="" disabled selected>請選擇上課時段</option>')
      .append(
        classTimes.map(
          (time) => `<option value="${time.time}">${time.time}</option>`
        )
      );
    $("#timeslotSelectGroup").show();
  } else {
    $("#scheduleMessage").html(
      '<span style="color:red;">當天沒有可用時段</span>'
    );
    $("#timeslotSelectGroup").hide();
    return;
  }

  $("#classNumSelectGroup").hide(); // 等選擇時段後再顯示堂數選項
});

$("#timeslotSelect").on("change", function () {
  if ($(this).val()) {
    $("#classNumSelectGroup").show(); // 顯示堂數選項
  } else {
    $("#classNumSelectGroup").hide();
  }
});

// 清空排課表單內容函式
function clearScheduleForm() {
  $("#classroomAreaSelect").val(""); // 清空上課地點
  $("#classroomSelect").empty(); // 清空上課教室選擇
  $("#classroomSelectGroup").hide(); // 隱藏上課教室選擇
  $("#timeslotSelect").empty(); // 清空上課時段選擇
  $("#classDateSelectGroup").hide(); // 隱藏開始上課日期
  $("#classDate").empty(); // 清空開始上課日期
  $("#timeslotSelectGroup").hide(); // 隱藏上課時段選擇
  $("#classNumSelect").val(""); // 清空上課堂數選擇
  $("#classNumSelectGroup").hide();
  $("#scheduleMessage").html(""); // 清空訊息
}

// 先清空表單再顯示視窗
$("#fc_scheduleButton").on("click", function () {
  fc_clearScheduleForm();
});

// 只在index的時候作用
if (window.location.pathname === "/index") {
  // fc_scheduleButton Modal
  $("#fc_scheduleButton").fireModal({
    title: "排課",
    body: `
      <form id="fc_scheduleForm" method="POST" action="/fc_scheduleButton" enctype="multipart/form-data">
        <div class="form-group">
          <label for="classroomDateSelect">上課日期</label>
          <input type="date" class="form-control" id="classroomDateSelect" name="classroomDateSelect" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
        </div>
        <div class="form-group">
          <label for="fc_classroomAreaSelect">上課地點</label>
          <select class="form-control" id="fc_classroomAreaSelect" name="fc_classroomAreaSelect">
            <option value="" disabled selected>請選擇上課地點</option>
            ${classroom_area
              .map((c) => `<option value="${c}">${c}</option>`)
              .join("")}
          </select>
        </div>
        <div class="form-group" id="fc_classroomSelectGroup">
          <label for="classroomSelect">上課教室</label>
          <select class="form-control" id="fc_classroomSelect" name="fc_classroomSelect">
            <option value="" disabled selected>請先選擇上課地點</option>
          </select>
        </div>
        <div class="form-group" id="fc_timeslotSelectGroup">
          <label for="timeslotSelect">上課時段</label>
          <select class="form-control" id="fc_timeslotSelect" name="fc_timeslotSelect">
            <option value="">請先選擇上課教室</option>
          </select>
        </div>
      </form>
      <div id="fc_scheduleMessage"></div>
      <input style="display:none;" id="st_schedule_tr_id" name="st_schedule_tr_id">
      `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          // 當用戶點擊取消按鈕時，關閉模態並清空內容
          fc_clearScheduleForm();
          modal.modal("hide");
        },
      },
      {
        text: "確認",
        class: "btn btn-primary",
        handler: function (modal) {
          const classroomDateSelect = $("#classroomDateSelect").val();
          const fc_classroomAreaSelect = $("#fc_classroomAreaSelect").val();
          const fc_classroomSelect = $("#fc_classroomSelect").val();
          const fc_timeslotSelect = $("#fc_timeslotSelect").text();

          // 檢查是否有空的欄位
          if (
            !fc_classroomAreaSelect ||
            !fc_classroomSelect ||
            !fc_timeslotSelect
          ) {
            $("#fc_scheduleMessage").html(
              '<span style="color:red;">請選擇完整的排課資料</span>'
            );
            return;
          } else {
            if (sc_class_num < 20) {
              let day_event = [];
              // 檢查當天的事件，並存入 day_event 中
              for (let i = 0; i < event_data.length; i++) {
                const formattedEventDate = moment(
                  event_data[i]["start"]
                ).format("YYYY-MM-DD");
                if (formattedEventDate === classroomDateSelect) {
                  day_event.push(i);
                }
              }
              // 檢查時間衝突
              for (let i of day_event) {
                const day_time = event_data[i]["title"]
                  .split("\n")[1]
                  .split("-"); // 獲取開始和結束時間
                const select_time = fc_timeslotSelect.split(" ")[1].split("-"); // 獲取選擇的時間段
                // 如果開始時間相同，則判定為衝突
                if (day_time[0] === select_time[0]) {
                  $("#fc_scheduleMessage").html(
                    `<span style="color:red;">與您目前的課程衝堂，無法加選!</span>`
                  );
                  return; // 退出函數，停止加選
                }
              }

              $("#fc_scheduleForm").submit(); // 確保這行代碼執行
            } else {
              $("#fc_scheduleMessage").html(
                '<span style="color:red;">您所安排的課程已超過上課次數20堂!</span>'
              );
              return;
            }
          }
        },
      },
    ],
  });
}

$("#fc_classroomAreaSelect").on("change", function () {
  const selectedArea = $(this).val();

  if (selectedArea) {
    // Filter classrooms based on the selected area
    const filteredClassrooms = [
      ...new Set(
        classroom_data
          .filter((item) => item.classroom.startsWith(selectedArea))
          .map((item) => item.classroom)
      ),
    ]; // Extract unique classroom names

    $("#fc_classroomSelect")
      .empty()
      .append(`<option value="" disabled selected>請選擇教室</option>`)
      .append(
        filteredClassrooms.map((c) => `<option value="${c}">${c}</option>`)
      );

    // Show classroom select
    $("#fc_classroomSelectGroup").show();

    // Reset timeslot options
    $("#fc_timeslotSelect").html(
      '<option value="" disabled selected>請選擇上課時段</option>'
    );
    $("#fc_timeslotSelectGroup").hide();
  } else {
    // Hide classroom select and timeslot select
    $("#fc_classroomSelectGroup").hide();
    $("#fc_timeslotSelectGroup").hide();
  }
});

// 當選擇教室時
$("#fc_classroomSelect").on("change", function () {
  const selectedClassroom = $(this).val();
  const selectedDate = new Date($("#classroomDateSelect").val());

  // 取得選擇的日期的星期幾 (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const selectedWeekdayNumber = selectedDate.getDay();

  // 建立一個對應的中文星期對照表
  const weekdayMap = {
    0: "日",
    1: "一",
    2: "二",
    3: "三",
    4: "四",
    5: "五",
    6: "六",
  };

  const selectedWeekdayChinese = weekdayMap[selectedWeekdayNumber];

  if (selectedClassroom && selectedWeekdayChinese) {
    const classTimes = [];

    classroom_data.forEach((item) => {
      if (
        item.classroom === selectedClassroom &&
        item.class_week === selectedWeekdayChinese
      ) {
        let currentAttendanceText = "";
        // 獲取當前時段的所有教師資料
        const teachers = item.trs; // 教師陣列 [{tr_id, tr_name, tr_course}, ...]

        // 判斷是否有教師符合條件
        const isEligible = teachers.some((teacher) => {
          if (course_id < 10) {
            return true; // 如果學生課程 ID < 10，任何老師都可以
          } else {
            return teacher.tr_course === course_id; // 必須有至少一個老師的課程 ID 匹配
          }
        });

        if (!isEligible) {
          currentAttendanceText = ` (無法選擇)`; // 沒有符合條件的老師
        } else {
          // 判斷是否時段已滿
          const matchingRecord = classroom_attend_data.find(
            (attend) =>
              attend.classtime_id === item.classtime_id &&
              attend.class_date === $("#classroomDateSelect").val()
          );

          if (matchingRecord) {
            currentAttendanceText = ` (額滿)`; // 如果該時段已滿
          }
        }

        // const classTime = `星期${item.class_week} ${item.start_time}-${item.end_time}${currentAttendanceText}`;
        classTimes.push({
          classtime_id: item.classtime_id, // 時段唯一標識
          time: `星期${item.class_week} ${item.start_time}-${item.end_time}${currentAttendanceText}`,
        });
      }
    });

    // 根據篩選的結果來填充時段選擇框
    $("#fc_timeslotSelect")
      .empty()
      .append('<option value="" disabled selected>請選擇上課時段</option>')
      .append(
        classTimes.map(({ classtime_id, time }) => {
          const isFull = time.includes("(額滿)"); // 檢查是否為 "(額滿)"
          const isUnavailable = time.includes("(無法選擇)"); // 檢查是否為 "(無法選擇)"

          // 根據不同條件設置樣式和禁用狀態
          const style = isFull
            ? "color: red;"
            : isUnavailable
            ? "color: gray;"
            : "";
          const disabled = isFull || isUnavailable ? "disabled" : "";

          return `<option value="${classtime_id}" style="${style}" ${disabled}>${time}</option>`;
        })
      );

    // 顯示時段選擇框
    $("#fc_timeslotSelectGroup").show();
  } else {
    // 如果沒有選擇教室或日期，隱藏時段選擇框
    $("#fc_timeslotSelectGroup").hide();
  }
});

// 清空排課表單內容函式
function fc_clearScheduleForm() {
  $("#fc_classroomAreaSelect").val(""); // 清空上課地點
  $("#fc_classroomSelect").empty(); // 清空上課教室選擇
  $("#fc_classroomSelectGroup").hide(); // 隱藏上課教室選擇
  $("#fc_timeslotSelect").empty(); // 清空上課時段選擇
  $("#fc_timeslotSelectGroup").hide(); // 隱藏上課時段選擇
  $("#fc_scheduleMessage").html(""); // 清空訊息
}

// FilterModalButton Modal
$("#FilterModalButton").fireModal({
  title: "選擇日期",
  body: `
    <form>
      <div class="form-group">
        <label for="modalYearSelect">年份:</label>
        <select id="modalYearSelect" class="form-control"></select>
      </div>
      <div class="form-group">
        <label for="modalMonthSelect">月份:</label>
        <select id="modalMonthSelect" class="form-control"></select>
      </div>
      <div id="filterMessage"></div>
    </form>
  `,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary",
      handler: function (modal) {
        // 當用戶點擊取消按鈕時，關閉模態
        modal.modal("hide");
      },
    },
    {
      id: "applyFilters",
      text: "確認",
      class: "btn btn-primary",
      handler: function (modal) {
        modal.modal("hide");
      },
    },
  ],
});

$("#fc_leaveButton").fireModal({
  title: "請假",
  body: `
    <form id="fc_leaveForm" method="POST" action="/fc_leaveButton">
      <div class="form-group">
        <label for="fc_leaveDayDate">日期</label>
        <input type="date" name="fc_leaveDayDate" class="form-control" id="fc_leaveDayDate" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
      </div>
      <div class="form-group">
        <label for="fc_leaveDayClassroom">上課地點</label>
        <input type="text" name="fc_leaveDayClassroom" class="form-control" id="fc_leaveDayClassroom" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
      </div>
      <div class="form-group">
        <label for="fc_leaveDayClasstime">上課時段</label>
        <input type="text" name="fc_leaveDayClasstime" class="form-control" id="fc_leaveDayClasstime" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
      </div>
      <input type="hidden" id="fc_leavestatus" name="fc_leavestatus">
      <input type="hidden" id="fc_attend_id" name="fc_attend_id">
    </form>
  `,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary btn-left",
      handler: function (modal) {
        // 當使用者點擊取消按鈕時，關閉模態框
        modal.modal("hide");
      },
    },
    {
      text: "退選",
      class: "btn btn-danger",
      submit: true,
      id: "fc_dropCourse",
      handler: function (modal) {
        $("#fc_leavestatus").val("dropCourse");
        modal.modal("hide");
      },
    },
    {
      text: "請假",
      class: "btn btn-primary",
      submit: true,
      id: "fc_saveLleave",
      handler: function (modal) {
        $("#fc_leavestatus").val("saveLleave");
        modal.modal("hide");
      },
    },
  ],
});

$("#fc_notLeaveButton").fireModal({
  title: "取消請假",
  body: `
    <form id="fc_notLeaveForm" method="POST" action="/fc_notLeaveButton">
      <div class="form-group">
        <label for="fc_notLeaveDayDate">日期</label>
        <input type="date" name="fc_notLeaveDayDate" class="form-control" id="fc_notLeaveDayDate" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
      </div>
      <div class="form-group">
        <label for="fc_notLeaveDayClassroom">上課地點</label>
        <input type="text" name="fc_notLeaveDayClassroom" class="form-control" id="fc_notLeaveDayClassroom" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
      </div>
      <div class="form-group">
        <label for="fc_notLeaveDayClasstime">上課時段</label>
        <input type="text" name="fc_notLeaveDayClasstime" class="form-control" id="fc_notLeaveDayClasstime" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
      </div>
      <span id="st_notLeaveMsg" name="st_notLeaveMsg" style="color:red;"></span>
      <input type="hidden" id="fc_notAttend_id" name="fc_notAttend_id">
    </form>
  `,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary",
      handler: function (modal) {
        // 當使用者點擊取消按鈕時，關閉模態框
        modal.modal("hide");
      },
    },
    {
      text: "確認",
      class: "btn btn-primary",
      handler: function (modal) {
        var formData = $("#fc_notLeaveForm").serialize(); // 獲取表單數據
        $.ajax({
          type: "POST",
          url: "/fc_notLeaveButton",
          data: formData,
          success: function (response) {
            if (response.status === "full") {
              // 如果人數已滿，則顯示提示資訊
              $("#st_notLeaveMsg").text("人數已滿，無法上課!");
            } else if (response.status === "success") {
              // 如果更新成功，關閉模態框
              window.location.reload();
              modal.modal("hide");
            }
          },
          error: function () {
            alert("發生錯誤，請稍後再試。");
          },
        });
      },
    },
  ],
});

$("#updateDataButton").on("click", function () {
  clearupdateForm();
});

if (window.location.pathname === "/profiles") {
  // updateDataButton Modal
  $("#updateDataButton").fireModal({
    title: "更新資料",
    body: `
      <form id="updateForm" method="POST" action="/update_profile" enctype="multipart/form-data">
          <div class="form-group">
              <label for="file">學生證:</label><br>
              <input type="hidden" name="img_data" value=${picture}>
              <img src=${picture} id="uploadedImage" alt="上傳的圖片" style="max-width: 100px; margin-bottom: .5rem;">
              <span id="pic_msg" style="display: block; margin-bottom: .5rem;"></span>
              <input type="file" name="file" id="file" style="display:none;" accept="image/png, image/jpeg, image/jpg, image/webp">
              <button type="button" id="uploadButton" class="btn btn-primary">上傳照片</button>
          </div>
          <div class="form-group">
              <label for="phone1">聯絡電話-1<span style="color: red;">*</span></label>
              <input type="text" class="form-control" id="phone1" name="phone1" value=${phone1}>
          </div>
          <div class="form-group">
              <label for="phone2">聯絡電話-2</label>
              <input type="text" class="form-control" id="phone2" name="phone2" value=${phone2}>
          </div>
          <div class="form-group">
              <label for="email">Email<span style="color: red;">*</span></label>
              <input type="email" class="form-control" id="email" name="email" value=${email}>
          </div>
          <div class="form-group">
              <label for="address">聯絡住址<span style="color: red;">*</span></label>
              <input type="text" class="form-control" id="address" name="address" value=${address}>
          </div>
          <div class="form-group">
              <label for="workplace">就讀學校/就業公司<span style="color: red;">*</span></label>
              <input type="text" class="form-control" id="workplace" name="workplace" value=${workplace}>
          </div>
          <div class="form-group">
              <label for="profession">職業<span style="color: red;">*</span></label>
              <input type="text" class="form-control" id="profession" name="profession" value=${profession}>
          </div>
          <span id="submit_msg" style="display: block; margin-bottom: .5rem; color: red;"></span>
      </form>
  `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          // 當點擊取消按鈕時關閉模態框
          clearupdateForm();
          modal.modal("hide");
        },
      },
      {
        text: "確認更改",
        class: "btn btn-primary",
        // submit: true,
        handler: function (modal) {
          var pic_msg = $("#pic_msg").text();
          var phone1 = $("#phone1").val();
          var phone2 = $("#phone2").val();
          var email = $("#email").val();
          var address = $("#address").val();
          var workplace = $("#workplace").val();
          var profession = $("#profession").val();
          var submit_msg = $("#submit_msg");

          // 定義電話和郵件的正則表達式
          var phoneRegex = /^\d{10}$/; // 10 到 15 位數字
          var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 簡單的 Email 格式驗證

          // 檢查資料完整性及格式
          if (
            pic_msg !== "" ||
            phone1 === "" ||
            !phoneRegex.test(phone1) ||
            (phone2 !== "" && !phoneRegex.test(phone2)) ||
            !emailRegex.test(email) ||
            address === "" ||
            workplace === "" ||
            profession === ""
          ) {
            submit_msg.text("資料有誤，請重新確認!");
            return; // 阻止表單提交
          } else {
            modal.modal("hide");
            $("#updateForm").submit(); // 提交表單
          }
        },
      },
    ],
  });
}

$("#tr_updateDataButton").on("click", function () {
  tr_clearupdateForm();
});

if (window.location.pathname === "/tr_profiles") {
  // updateDataButton Modal
  $("#tr_updateDataButton").fireModal({
    title: "更新資料",
    body: `
      <form id="tr_updateForm" method="POST" action="/update_tr_profile" enctype="multipart/form-data">
          <div class="form-group">
              <label for="tr_file">教師證:</label><br>
              <input type="hidden" name="tr_img_data" value=${picture}>
              <img src=${picture} id="tr_uploadedImage" alt="上傳的圖片" style="max-width: 100px; margin-bottom: .5rem;">
              <span id="tr_pic_msg" style="display: block; margin-bottom: .5rem;"></span>
              <input type="file" name="tr_file" id="tr_file" style="display:none;" accept="image/png, image/jpeg, image/jpg, image/webp">
              <button type="button" id="tr_uploadButton" class="btn btn-primary">上傳照片</button>
          </div>
          <div class="form-group">
              <label for="tr_phone1">聯絡電話-1<span style="color: red;">*</span></label>
              <input type="text" class="form-control" id="tr_phone1" name="tr_phone1" value=${phone1}>
          </div>
          <div class="form-group">
              <label for="tr_phone2">聯絡電話-2</label>
              <input type="text" class="form-control" id="tr_phone2" name="tr_phone2" value=${phone2}>
          </div>
          <div class="form-group">
              <label for="tr_email">Email<span style="color: red;">*</span></label>
              <input type="email" class="form-control" id="tr_email" name="tr_email" value=${email}>
          </div>
          <div class="form-group">
              <label for="tr_address">聯絡住址<span style="color: red;">*</span></label>
              <input type="text" class="form-control" id="tr_address" name="tr_address" value=${address}>
          </div>
          <span id="tr_submit_msg" style="display: block; margin-bottom: .5rem; color: red;"></span>
      </form>
  `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          // 當點擊取消按鈕時關閉模態框
          tr_clearupdateForm();
          modal.modal("hide");
        },
      },
      {
        text: "確認更改",
        class: "btn btn-primary",
        // submit: true,
        handler: function (modal) {
          var pic_msg = $("#tr_pic_msg").text();
          var phone1 = $("#tr_phone1").val();
          var phone2 = $("#tr_phone2").val();
          var email = $("#tr_email").val();
          var address = $("#tr_address").val();
          var submit_msg = $("#tr_submit_msg");

          // 定義電話和郵件的正則表達式
          var phoneRegex = /^\d{10}$/; // 10 到 15 位數字
          var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 簡單的 Email 格式驗證

          // 檢查資料完整性及格式
          if (
            pic_msg !== "" ||
            phone1 === "" ||
            !phoneRegex.test(phone1) ||
            (phone2 !== "" && !phoneRegex.test(phone2)) ||
            !emailRegex.test(email) ||
            address === ""
          ) {
            submit_msg.text("資料有誤，請重新確認!");
            return; // 阻止表單提交
          } else {
            modal.modal("hide");
            $("#tr_updateForm").submit(); // 提交表單
          }
        },
      },
    ],
  });
}

function tr_clearupdateForm() {
  $("#tr_updateForm")[0].reset();
  $("#tr_pic_msg").text("");
  $("#tr_submit_msg").text("");
  $("#tr_uploadedImage").attr("src", picture);
  $("#tr_uploadedImage").show();
}

$("#fc_scheduleError_1").fireModal({
  title: '<span style="color:#f36969;">警告⚠️<span style="color:red;">',
  body: "只能選擇今天以後的日期來進行排課!",
});

if (window.location.pathname === "/index") {
  $("#fc_scheduleError_2").fireModal({
    title: '<span style="color:#f36969;">警告⚠️<span style="color:red;">',
    body: `只能選擇${moment(end_class_date).format(
      "YYYY-MM-DD"
    )}前的日期進行排課!`,
  });
}

$("#loginFailure1").fireModal({
  title: '<span style="color:#f36969;">登入失敗❌<span style="color:red;">',
  body: "請確認帳號或密碼是否輸入正確!",
});

// $("#loginFailure2").fireModal({
//   title: '<span style="color:#f36969;">登入失敗❌<span style="color:red;">',
//   body: "請聯繫我們!",
// });

if (window.location.pathname === "/certificate") {
  $("#cert_updateDataButton").fireModal({
    title: "上傳證照",
    body: `
    <form id="updateForm" method="POST" action="/cert_updateDataButton" enctype="multipart/form-data">
        <div class="form-group">
            <label for="cert_name">認證單位<span style="color: red;">*</span></label>
            <select class="form-control" id="cert_name" name="cert_name" onchange="toggleCustomCertName()">
                <option value="" disabled selected>選擇認證單位</option>
                ${names
                  .map(
                    (name) => `
                  <option value="${name}">${name}</option>`
                  )
                  .join("")}
            </select>
            <input type="text" class="form-control mt-2" id="cert_name_other" name="cert_name_other" placeholder="請輸入認證單位" style="display:none;">
        </div>
        <div class="form-group">
            <label for="cert_program">認證科目<span style="color: red;">*</span></label>
            <select class="form-control" id="cert_program" name="cert_program" onchange="toggleCustomCertProgram()">
                <option value="" disabled selected>選擇認證科目</option>
                ${programs
                  .map(
                    (program) => `
                  <option value="${program}">${program}</option>`
                  )
                  .join("")}
            </select>
            <input type="text" class="form-control mt-2" id="cert_program_other" name="cert_program_other" placeholder="請輸入認證科目" style="display:none;">
        </div>
        <div class="form-group">
            <label for="cert_date">考照日期<span style="color: red;">*</span></label>
            <input type="date" class="form-control" id="cert_date" name="cert_date" value=''>
        </div>
        <div class="form-group">
            <label for="file">證照圖片<span style="color: red;">*</span></label><br>
            <img src='' id="uploadedImage" alt="上傳的圖片" style="max-width: 100px; margin-bottom: .5rem; display: none">
            <span id="pic_msg" style="display: block; margin-bottom: .5rem;"></span>
            <input type="file" name="file" id="file" style="display:none;" accept="image/png, image/jpeg, image/jpg, image/webp">
            <button type="button" id="uploadButton" class="btn btn-primary">上傳照片</button>
        </div>
        <span id="submit_msg" style="display: block; margin-bottom: .5rem; color: red;"></span>
    </form>
    <div id="cert_updateDataMessage"></div>
  `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          modal.modal("hide");
        },
      },
      {
        text: "送出",
        class: "btn btn-primary",
        handler: function (modal) {
          const certName = document.getElementById("cert_name").value;
          const certProgram = document.getElementById("cert_program").value;
          const certDate = document.getElementById("cert_date").value;
          const fileInput = document.getElementById("file");

          // 檢查必填欄位
          if (
            !certName ||
            !certProgram ||
            !certDate ||
            fileInput.files.length === 0
          ) {
            $("#cert_updateDataMessage").html(
              '<span style="color:red;">請輸入完整的證照資料!</span>'
            );
            return; // 結束函數，防止提交
          }

          // 確保日期不超過今天
          const today = new Date();
          const selectedDate = new Date(certDate);
          if (selectedDate > today) {
            $("#cert_updateDataMessage").html(
              '<span style="color:red;">考照日期格是錯誤!</span>'
            );
            return; // 結束函數，防止提交
          }

          $("#updateForm").submit();
        },
      },
    ],
  });
}
// 控制自定義認證單位輸入框的顯示和隱藏
function toggleCustomCertName() {
  const selectElement = document.getElementById("cert_name");
  const otherInput = document.getElementById("cert_name_other");

  if (selectElement.value === "其他") {
    otherInput.style.display = "block"; // 顯示輸入框
    otherInput.value = ""; // 清空輸入框
  } else {
    otherInput.style.display = "none"; // 隱藏輸入框
  }
}

// 控制自定義認證科目輸入框的顯示和隱藏
function toggleCustomCertProgram() {
  const selectElement = document.getElementById("cert_program");
  const otherInput = document.getElementById("cert_program_other");

  if (selectElement.value === "其他") {
    otherInput.style.display = "block"; // 顯示輸入框
    otherInput.value = ""; // 清空輸入框
  } else {
    otherInput.style.display = "none"; // 隱藏輸入框
  }
}

// 學生資料新增
if (window.location.pathname === "/ad_index") {
  $("#st_insertDataButton").fireModal({
    size: "modal-lg",
    title: "學生資料新增",
    body: `
      <form id="studentDataForm" method="POST" action="/st_insertDataButton">
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="name">學生姓名 <span style="color: red">*</span></label>
              <input type="text" name="name" class="form-control" id="name" required>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="age">年齡 <span style="color: red">*</span></label>
              <input type="number" name="age" class="form-control" id="age" required>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="acc">帳號 <span style="color: red">*</span></label>
              <input type="text" name="acc" class="form-control" id="acc" required>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="pwd">密碼 <span style="color: red">*</span></label>
              <input type="text" name="pwd" class="form-control" id="pwd" required>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <label for="email">Email <span style="color: red">*</span></label>
              <input type="email" name="email" class="form-control" id="email" required>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <label for="address">聯絡住址 <span style="color: red">*</span></label>
              <input type="text" name="address" class="form-control" id="address" required>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="tuition">學費 <span style="color: red">*</span></label>
              <input type="number" name="tuition" class="form-control" id="tuition" required>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="course_id">學習進度 <span style="color: red">*</span></label>
              <select name="course_id" class="form-control" id="course_id" required>
                <option value="" disabled selected>請選擇學習進度</option>
                ${course_name_data
                  .map(
                    (course) =>
                      `<option value="${course.course_id}">${course.name}</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div> 
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="parent">家長姓名 <span style="color: red">*</span></label>
              <input type="text" name="parent" class="form-control" id="parent" required>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="phone1">連絡電話1 <span style="color: red">*</span></label>
              <input type="text" name="phone1" class="form-control" id="phone1" required>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="phone2">連絡電話2</label>
              <input type="text" name="phone2" class="form-control" id="phone2">
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="workplace">就讀學校/就業公司 <span style="color: red">*</span></label>
              <input type="text" name="workplace" class="form-control" id="workplace" required>
            </div>
          </div>
          <div class="col-6">
            <div class="form-group">
              <label for="profession">職業 <span style="color: red">*</span></label>
              <input type="text" name="profession" class="form-control" id="profession" required>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <div class="form-group">
              <label for="note">備註</label>
              <textarea name="note" class="form-control" id="note" rows="1"></textarea>
            </div>
          </div>
        </div>
        <span id="st_insertDataMessage" style="display: block; margin-bottom: .5rem; color: red; margin: 0;"></span>
      </form>
  `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          modal.modal("hide");
        },
      },
      {
        text: "送出",
        class: "btn btn-primary",
        handler: function (modal) {
          const message = $("#st_insertDataMessage");
          const userId = $("#name").val();
          const age = $("#age").val();
          const email = $("#email").val();
          const phone1 = $("#phone1").val();
          const tuition = $("#tuition").val();
          const address = $("#address").val();
          const parent = $("#parent").val();
          const workplace = $("#workplace").val();
          const profession = $("#profession").val();
          const note = $("#note").val(); // 取得 note 欄位的值
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const phonePattern = /^[0-9]{10}$/;
          const tuitionPattern = /^[0-9]+$/;

          // 清空之前的錯誤訊息
          message.text("");

          if (!emailPattern.test(email)) {
            message.text("Email 格式錯誤!");
            return;
          }
          if (!phonePattern.test(phone1)) {
            message.text("電話號碼格式錯誤!");
            return;
          }
          if (note.length > 100) {
            message.text("備註不能超過 100 字!");
            return;
          }

          if (
            !userId ||
            !age ||
            !email ||
            !phone1 ||
            !tuition ||
            !address ||
            !parent ||
            !workplace ||
            !profession
          ) {
            message.text("請輸入完整資料!");
            return;
          }
          $("#studentDataForm").submit();
        },
      },
    ],
  });
}

if (window.location.pathname === "/ad_index") {
  const textarea = document.getElementById("note");
  textarea.addEventListener("input", function () {
    // 設置高度並強制使用 !important
    this.setAttribute("style", `height: ${this.scrollHeight}px !important;`);
  });

  $("#editStudentButton").fireModal({
    size: "modal-lg",
    title: `<span>學生資料【<span id="st_id_edit"></span>】</span>`,
    body: `
    <form id="editStudentForm" method="POST" action="/editStudentButton">
      <input type="input" style="display: none;" id="st_id_input_edit" name="st_id">
      <div class="form-group">
        <img src="" id="st_picture_edit" alt="上傳的圖片" style="max-width: 100px;">
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_name">學生姓名</label>
            <input type="text" id="st_name_edit" name="st_name" class="form-control">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_age">年齡</label>
            <input type="number" id="st_age_edit" name="st_age" class="form-control">
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_acc">帳號</label>
            <input type="text" id="st_acc_edit" name="st_acc" class="form-control">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_pwd">密碼</label>
            <div class="d-flex align-items-center">
              <button id="st_pwd_reset" type="button" class="btn btn-primary" style="margin-right: 10px;">重設密碼</button>
              <input type="text" id="st_pwd_edit" name="st_pwd" class="form-control" style="display: none;">
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_course_name">學習進度</label>
            <select type="select" id="st_course_name_edit" name="st_course_name" class="form-control"></select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_tuition">學費</label>
            <input type="number" id="st_tuition_edit" name="st_tuition" class="form-control">
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_parent">家長姓名</label>
            <input type="text" id="st_parent_edit" name="st_parent" class="form-control">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_phone1">連絡電話1</label>
            <input type="text" id="st_phone1_edit" name="st_phone1" class="form-control">
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
              <label for="st_phone2">連絡電話2</label>
              <input type="text" id="st_phone2_edit" name="st_phone2" class="form-control">
          </div>
        </div>
      </div>  
      <div class="row">
        <div class="col-md-12">
            <div class="form-group">
              <label for="st_address">地址</label>
              <input type="text" id="st_address_edit" name="st_address" class="form-control">
            </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
                <label for="st_email">Email</label>
                <input type="email" id="st_email_edit" name="st_email" class="form-control">
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_workplace">工作地點</label>
            <input type="text" id="st_workplace_edit" name="st_workplace" class="form-control">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_profession">職業</label>
            <input type="text" id="st_profession_edit" name="st_profession" class="form-control">
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
            <label for="st_note">備註</label>
            <textarea id="st_note_edit" name="st_note" class="form-control"></textarea>
          </div>
        </div>   
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
            <label for="st_pay_num">繳費次數</label>
            <input type="number" id="st_pay_num_edit" class="form-control" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
            <label for="st_create_date">入學日期</label>
            <input type="text" id="st_create_date_edit" class="form-control" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
          </div>
        </div>
      </div>
      <span id="editStudenMessage" style="display: block; margin-bottom: .5rem; color: red; margin: 0;"></span>
    </form>
    `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          modal.modal("hide");
        },
      },
      {
        text: "送出",
        class: "btn btn-primary",
        handler: function (modal) {
          const Message = $("#editStudenMessage");
          $("#st_id_input_edit").val($("#st_id_edit").text());
          const stName = $("#st_name_edit").val().trim();
          const stAge = $("#st_age_edit").val();
          const stAcc = $("#st_acc_edit").val().trim();
          const stPwd = $("#st_pwd_edit").val().trim();
          const stCourseId = $("#st_course_name_edit").val();
          const stTuition = $("#st_tuition_edit").val();
          const stParent = $("#st_parent_edit").val().trim();
          const stPhone1 = $("#st_phone1_edit").val().trim();
          const stEmail = $("#st_email_edit").val().trim();
          const stAddress = $("#st_address_edit").val().trim();
          const stWorkplace = $("#st_workplace_edit").val().trim();
          const stProfession = $("#st_profession_edit").val().trim();
          const stNote = $("#st_note_edit").val().trim();

          Message.text("");
          // 檢查所有必填欄位
          if (
            !stName ||
            !stAge ||
            !stAcc ||
            (!stPwd && $("#st_pwd_edit").is(":visible")) || // Check if stPwd is required when it's visible
            !stTuition ||
            !stParent ||
            !stPhone1 ||
            !stEmail ||
            !stAddress ||
            !stWorkplace ||
            !stProfession
          ) {
            Message.text("請輸入完整資料!");
            return;
          }

          // 驗證 email 格式
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(stEmail)) {
            Message.text("請輸入有效的 Email 位址。");
            return;
          }

          // 檢查備註字數
          if (stNote.length > 100) {
            Message.text("備註不能超過100字。");
            return;
          }
          // 提交後關閉模態
          $("#editStudentForm").submit();
        },
      },
    ],
  });
}

if (window.location.pathname === "/ad_index") {
  $("#leaveStudentButton").fireModal({
    title: `<span>學生休學</span>`,
    body: `
  <form id="leaveStudentForm" method="POST" action="/leaveStudentButton" style="margin-bottom: -45px;">
    <div style="margin-bottom: 15px;">
      <label for="st_id_leave" style="font-weight: bold;">學號:</label>
      <span id="st_id_leave" name="st_id"></span>
    </div>
    <div style="margin-bottom: 15px;">
      <label for="st_name_leave" style="font-weight: bold;">姓名:</label>
      <span id="st_name_leave"></span>
    </div>
    <input type="input" style="display: none" id="st_id_leave_input" name="st_id">
  </form>
  `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          modal.modal("hide");
        },
      },
      {
        text: "確認",
        class: "btn btn-danger",
        handler: function (modal) {
          $("#st_id_leave_input").val($("#st_id_leave").text());
          $("#leaveStudentForm").submit();
        },
      },
    ],
  });
}

$("#st_scheduleButton").fireModal({
  title: `<span>新增學生上課時段</span>`,
  body: `
    <form id="search_st_info" method="POST" action="/st_scheduleButton">
      <div class="form-group" style="margin-bottom: 15px;">
        <label for="search_st_id">學號:</label>
        <div class="input-group">
          <input type="text" class="form-control" id="search_st_id" name="search_st_id">
          <div class="input-group-append">
            <button id="searchStudentBtn" class="btn btn-primary" type="button">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>
        <br>
        <div class="form-group" style="margin-bottom: 15px;">
          <label for="search_st_name">姓名:</label>
          <label id="search_st_name"></label>
          <input type="input" style="display: none;" id="search_st_course_id">
        </div>
      </div>
      <div class="form-group">
        <label for="search_semester">上課學期</label>
        <select class="form-control" id="search_semester" name="search_semester">
        </select>
      </div>
      <div class="form-group">
        <label for="search_semester_start_date">學期起始日期</label>
        <input type="date" class="form-control" id="search_semester_start_date" name="search_semester_start_date"></input>
      </div>
      <div class="form-group">
        <label id="semester_range" style="margin-top: 10px">學期範圍:</label>
      </div>
      <div class="form-group">
        <label for="search_classtime_id">上課時段</label>
        <select class="form-control" id="search_classtime_id" name="search_classtime_id">
        </select>
      </div>
      <div class="form-group">
        <label for="search_tr_id">授課老師</label>
        <select class="form-control" id="search_tr_id" name="search_tr_id"></select>
      </div>
      <div class="form-group" id="st_schedule_info">
        <span style="font-weight: 600; color: #34395e; font-size: 12px;">目前已選擇:</span><br>
        <span id="currentSelection" style="font-weight: 600; color: #34395e; font-size: 12px;"></span><br>
        <input id="currentSelection_val" style="display:none" name="currentSelection_val"></input>
        <input id="old_classtime_id" style="display:none" name="old_classtime_id"></input>
      </div>
      <span id="search_st_info_msg" style="display: block; margin-bottom: .5rem; color: red;"></span>
    </form>
  `,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary btn-left", // 將取消按鈕置左
      handler: function (modal) {
        modal.modal("hide");
      },
    },
    {
      text: "新增",
      class: "btn btn-outline-primary",
      handler: function (modal) {
        addClassTime();
      },
    },
    {
      text: "確認",
      class: "btn btn-primary",
      handler: function (modal) {
        const st_id = $("#search_st_id").val().trim();
        const currentSelection_val = $("#currentSelection_val").val();
        if (!st_id || !currentSelection_val) {
          $("#search_st_info_msg").text("請選擇完整資料！");
        } else {
          $("#search_st_info").submit();
        }
      },
    },
  ],
});

function addClassTime() {
  const classtime = $("#search_classtime_id option:selected");
  const teacher = $("#search_tr_id option:selected");

  if (classtime.val() !== "" && teacher.val() !== "") {
    // 獲取當前已選擇的內容
    let currentSelections = $("#currentSelection").html();
    let currentSelection_val = $("#currentSelection_val").val();

    // 創建要添加的新條目
    const newEntry = `${classtime.text()} ${teacher.text()}`;
    const newEntryVal = `${classtime.val()} ${teacher.val()}`;

    // 檢查當前選擇中是否已有相同的 classtime
    const existingEntryRegex = new RegExp(`^${classtime.text()}\\s+.*?$`, "gm"); // 用正則匹配當前的 classtime

    if (existingEntryRegex.test(currentSelections)) {
      // 如果已有相同的 classtime，替換成最新的 teacher
      currentSelections = currentSelections.replace(
        existingEntryRegex,
        newEntry
      );
    } else {
      // 如果當前選擇為空，直接添加
      currentSelections = currentSelections
        ? `${currentSelections}<br>${newEntry}` // 用逗號分隔
        : newEntry;
    }

    // 更新 currentSelection_val，確保根據 classtime 和 teacher 的值進行更新
    const existingValRegex = new RegExp(`^${classtime.val()}\\s+.*?$`, "gm"); // 用正則匹配當前的 classtime ID

    if (existingValRegex.test(currentSelection_val)) {
      // 如果已有相同的 classtime ID，替換成最新的
      currentSelection_val = currentSelection_val.replace(
        existingValRegex,
        newEntryVal
      );
    } else {
      currentSelection_val = currentSelection_val
        ? `${currentSelection_val}, ${newEntryVal}` // 使用逗號分隔
        : newEntryVal;
    }

    // 更新介面和隱藏輸入框的值
    $("#currentSelection").html(currentSelections);
    $("#currentSelection_val").val(currentSelection_val);
    $("#search_classtime_id").val("");
    $("#search_tr_id").val("");
  }
}

function search_st_info_form() {
  $("#search_st_id").val("");
  $("#search_st_name").text("");
  $("#search_classtime_id").val("");
  $("#search_tr_id").val("");
  $("#search_st_info_msg").text("");
  $("#search_classtime_id").closest(".form-group").hide(); // 隱藏上課時段的 div
  $("#search_tr_id").closest(".form-group").hide(); // 隱藏授課老師的 div
}

$("#edit_st_scheduleButton").fireModal({
  title: `<span>編輯學生資訊</span>`,
  body: `
    <form id="editStudentForm" method="POST" action="/editStudentButton">
      <div class="form-group" style="margin-bottom: 15px;">
        <label for="st_id_forTr">學號:</label>
        <label id="st_id_forTr"></label>
      </div>
      <div class="form-group" style="margin-bottom: 15px;">
        <label for="st_name_forTr">姓名:</label>
        <label id="st_name_forTr"></label>
      </div>
      <div class="form-group">
        <label for="st_classroom_name_forTr">上課時段</label>
        <select class="form-control" id="st_classroom_name_forTr" name="st_classroom_name_forTr"></select>
      </div>
      <div class="form-group">
        <label for="st_tr_name_forTr">授課老師</label>
        <select class="form-control" id="st_tr_name_forTr" name="st_tr_name_forTr"></select>
      </div>
      <input type="input" style="display: none" id="st_id_edit_input" name="st_id">
    </form>
`,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary",
      handler: function (modal) {
        modal.modal("hide");
      },
    },
    {
      text: "確認",
      class: "btn btn-primary",
      handler: function () {
        $("#st_id_edit_input").val($("#st_id_edit").text());
        $("#editStudentForm").submit();
      },
    },
  ],
});

$("#leave_st_scheduleButton").fireModal({
  title: `<span>刪除學生資訊</span>`,
  body: `
    <form id="leaveStudentForm" method="POST" action="/leave_st_scheduleButton">
      <div class="form-group" style="margin-bottom: 15px;">
        <label for="st_id_forTr">學號:</label>
        <label id="st_id_forTr_leave"></label>
      </div>
      <div class="form-group" style="margin-bottom: 15px;">
        <label for="st_name_forTr">姓名:</label>
        <label id="st_name_forTr_leave"></label>
      </div>
      <div class="form-group">
        <label for="st_classroom_name_forTr">上課時段</label>
        <input class="form-control" id="st_classroom_name_forTr_leave" readonly style="pointer-events: none; background-color: #efeeee; border: none;"></input>
      </div>
      <div class="form-group">
        <label for="st_tr_name_forTr">授課老師</label>
        <input class="form-control" id="st_tr_name_forTr_leave" readonly style="pointer-events: none; background-color: #efeeee; border: none;"></input>
      </div>
      <input type="input" style="display:none" id="semester_forTr_leave" name="semester_forTr_leave">
      <input type="input" style="display:none" id="st_id_forTr_leave_input" name="st_id_forTr_leave_input">
      <input type="input" style="display:none" id="classtime_id_forTr_leave" name="classtime_id_forTr_leave">
      
    </form>
`,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary",
      handler: function (modal) {
        modal.modal("hide");
      },
    },
    {
      text: "刪除",
      class: "btn btn btn-danger",
      handler: function () {
        $("#st_id_forTr_leave_input").val($("#st_id_forTr_leave").text());
        $("#leaveStudentForm").submit();
      },
    },
  ],
});

$("#st_pay_add").fireModal({
  title: "學生繳費",
  body: `<span id=st_pay_add_message></span>`,
});

if (window.location.pathname === "/tr_manage") {
  $("#editTeacherButton").fireModal({
    size: "modal-lg",
    title: `<span>老師資料【<span id="tr_id_edit"></span>】</span>`,
    body: `
    <form id="editTeacherForm" method="POST" action="/editTeacherButton">
      <input type="input" style="display: none;" id="tr_id_input_edit" name="tr_id">
      <div class="form-group">
        <img src="" id="tr_picture_edit" alt="上傳的圖片" style="max-width: 100px;">
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="tr_name">老師姓名</label>
            <input type="text" id="tr_name_edit" name="tr_name" class="form-control">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="trt_age">年齡</label>
            <input type="number" id="tr_age_edit" name="tr_age" class="form-control">
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="tr_acc">帳號</label>
            <input type="text" id="tr_acc_edit" name="tr_acc" class="form-control">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="tr_pwd">密碼</label>
            <div class="d-flex align-items-center">
              <button id="tr_pwd_reset" type="button" class="btn btn-primary" style="margin-right: 10px;">重設密碼</button>
              <input type="text" id="tr_pwd_edit" name="tr_pwd" class="form-control" style="display: none;">
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
            <label for="tr_course_name">授課項目</label>
            <div class="d-flex align-items-center">
              <select id="tr_course_name_edit" name="tr_course_name" class="form-control" style="flex: 1; margin-right: 10px;">
                <option value="" selected disabled>請選擇授課項目</option>
                ${course_data
                  .map(
                    (c) =>
                      `<option value="${c["course_id"]}">${c["course_name"]}</option>`
                  )
                  .join("")}
              </select>
              <button id="add-course-btn" type="button" class="btn btn-primary">新增</button>
            </div>
          </div>
          <div class="form-group mt-3">
            <label id="tr_course_name_choose">已選授課項目：</label><br>
            <input type="text" style="display:none" id="tr_course_val_choose" name="tr_course_val_choose"></input>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="tr_phone1">連絡電話1</label>
            <input type="text" id="tr_phone1_edit" name="tr_phone1" class="form-control">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
              <label for="tr_phone2">連絡電話2</label>
              <input type="text" id="tr_phone2_edit" name="tr_phone2" class="form-control">
          </div>
        </div>
      </div>  
      <div class="row">
        <div class="col-md-12">
            <div class="form-group">
              <label for="tr_address">地址</label>
              <input type="text" id="tr_address_edit" name="tr_address" class="form-control">
            </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
                <label for="tr_email">Email</label>
                <input type="email" id="tr_email_edit" name="tr_email" class="form-control">
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
                <input style="display: none;" type="text" id="tr_classtime_edit" name="tr_classtime_edit">
                <label for="tr_st_num" id="tr_classtime_st_num_edit">可接納學生數</label>
                <select id="tr_st_num" name="tr_st_num" class="form-control">
                  <option value="8">8</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                </select>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
            <label for="tr_create_date">入職日期</label>
            <input type="text" id="tr_create_date_edit" class="form-control" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
          </div>
        </div>
      </div>
      <span id="editTeacherMessage" style="display: block; margin-bottom: .5rem; color: red; margin: 0;"></span>
    </form>
    `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          modal.modal("hide");
        },
      },
      {
        text: "送出",
        class: "btn btn-primary",
        handler: function () {
          const Message = $("#editTeacherMessage");
          $("#tr_id_input_edit").val($("#tr_id_edit").text());
          const trName = $("#tr_name_edit").val().trim();
          const trAge = $("#tr_age_edit").val();
          const trAcc = $("#tr_acc_edit").val().trim();
          const trPwd = $("#tr_pwd_edit").val().trim();
          const trCourseId = $("#tr_course_val_choose").val();
          const trPhone1 = $("#tr_phone1_edit").val().trim();
          const trEmail = $("#tr_email_edit").val().trim();
          const trAddress = $("#tr_address_edit").val().trim();

          Message.text("");
          // 檢查所有必填欄位
          if (
            !trName ||
            !trAge ||
            !trAcc ||
            (!trPwd && $("#tr_pwd_edit").is(":visible")) || // Check if stPwd is required when it's visible
            !trCourseId ||
            !trPhone1 ||
            !trEmail ||
            !trAddress
          ) {
            Message.text("請輸入完整資料!");
            return;
          }

          // 驗證 email 格式
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(trEmail)) {
            Message.text("請輸入有效的 Email 位址。");
            return;
          }
          // 提交後關閉模態
          $("#editTeacherForm").submit();
        },
      },
    ],
  });
}

$("#leaveTeacherButton").fireModal({
  title: `<span>刪除時段</span>`,
  body: `
<form id="leaveStudentForm" method="POST" action="/leaveTeacherButton" style="margin-bottom: -45px;">
  <input type="text" id=st_num name="stnum" style="display: none;">
  <div style="margin-bottom: 15px;">
    <label for="classtroom_leave" style="font-weight: bold;">教室:</label>
    <span id="classtroom_leave" name="classtroom_leave"></span>
  </div>
  <div style="margin-bottom: 15px;">
    <label for="classtime_leave" style="font-weight: bold;">上課時段:</label>
    <span id="classtime_leave" name="classtime_leave"></span>
  </div>
  <div style="margin-bottom: 15px;">
    <label for="tr_name_leave" style="font-weight: bold;">負責老師:</label>
    <span id="tr_name_leave"></span>
  </div>
  <input type="input" style="display: none" id="tr_id_leave_input" name="tr_id">
  <span id="leave_tr_error_msg" style="display: block; margin-bottom: .5rem; color: red;"></span>
</form>
`,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary",
      handler: function (modal) {
        modal.modal("hide");
      },
    },
    {
      text: "刪除",
      class: "btn btn-danger",
      handler: function () {
        if ($("#st_num").val() > 0) {
          $("#leave_tr_error_msg").text("無法刪除，該老師負責時段還有學生!");
          return;
        }
        $("#leaveStudentForm").submit();
      },
    },
  ],
});

if (window.location.pathname === "/tr_manage") {
  $("#tr_insertDataButton").fireModal({
    size: "modal-lg",
    title: "老師資料新增",
    body: `
      <form id="teacherDataForm" method="POST" action="/tr_insertDataButton">
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="tr_name">老師姓名 <span style="color: red">*</span></label>
              <input type="text" name="tr_name" class="form-control" id="tr_name" required>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="age">年齡 <span style="color: red">*</span></label>
              <input type="number" name="age" class="form-control" id="age" required>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="tr_acc">帳號 <span style="color: red">*</span></label>
              <input type="text" name="tr_acc" class="form-control" id="tr_acc" required>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="tr_pwd">密碼 <span style="color: red">*</span></label>
              <input type="text" name="tr_pwd" class="form-control" id="tr_pwd" required>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <label for="email">Email <span style="color: red">*</span></label>
              <input type="email" name="email" class="form-control" id="email" required>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <label for="address">聯絡住址 <span style="color: red">*</span></label>
              <input type="text" name="address" class="form-control" id="address" required>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="phone1">連絡電話1 <span style="color: red">*</span></label>
              <input type="text" name="phone1" class="form-control" id="phone1" required>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="phone2">連絡電話2</label>
              <input type="text" name="phone2" class="form-control" id="phone2">
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <label for="tr_classtime_id">授課時段</label>
              <div class="d-flex align-items-center">
                <select id="tr_classtime_id" name="tr_classtime_id" class="form-control" style="flex: 1; margin-right: 10px;">
                  <option value="" selected disabled>請選擇授課時段</option>
                </select>
                <button id="add_tr_classtime_id" type="button" class="btn btn-primary">新增</button>
              </div>
            </div>
            <div class="form-group mt-3">
              <label id="tr_classtime_choose_insert">已選授課時段：</label><br>
              <input type="text" style="display:none" id="tr_classtimeid_choose_insert" name="tr_classtimeid_choose_insert"></input>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
                  <input style="display:none" type="text" id="have_st">
                  <input style="display:none" type="text" id="tr_classtime_edit" name="tr_classtime_edit">
                  <label for="tr_st_num" id="tr_classtime_st_num_edit">可接納學生數</label>
                  <select id="tr_st_num_insert" name="tr_st_num_insert" class="form-control">
                    <option value="8">8</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                  </select>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <label for="tr_course_name">授課項目</label>
              <div class="d-flex align-items-center">
                <select id="tr_course_name_insert" name="tr_course_name_insert" class="form-control" style="flex: 1; margin-right: 10px;">
                  <option value="" selected disabled>請選擇授課項目</option>
                  ${course_data
                    .map(
                      (c) =>
                        `<option value="${c["course_id"]}">${c["course_name"]}</option>`
                    )
                    .join("")}
                </select>
                <button id="add_course_btn_insert" type="button" class="btn btn-primary">新增</button>
              </div>
            </div>
            <div class="form-group mt-3">
              <label id="tr_course_name_choose_insert">已選授課項目：</label><br>
              <input type="text" style="display:none" id="tr_course_val_choose_insert" name="tr_course_val_choose_insert"></input>
            </div>
          </div>
        </div>
        <span id="tr_insertDataMessage" style="display: block; margin-bottom: .5rem; color: red; margin: 0;"></span>
      </form>
  `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          modal.modal("hide");
        },
      },
      {
        text: "送出",
        class: "btn btn-primary",
        handler: function () {
          const message = $("#tr_insertDataMessage");
          const tr_acc = $("#tr_acc").val();
          const tr_pwd = $("#tr_pwd").val();
          const tr_name = $("#tr_name").val();
          const age = $("#age").val();
          const email = $("#email").val();
          const phone1 = $("#phone1").val();
          const phone2 = $("#phone2").val();
          const address = $("#address").val();
          const tr_classtime = $("#tr_classtimeid_choose_insert").val();
          const tr_course_id = $("#tr_course_val_choose_insert").val();
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const phonePattern = /^[0-9]{10}$/;

          // 清空之前的錯誤訊息
          message.text("");

          if (!emailPattern.test(email)) {
            message.text("Email 格式錯誤!");
            return;
          }
          if (!phonePattern.test(phone1) || !phonePattern.test(phone2)) {
            message.text("電話號碼格式錯誤!");
            return;
          }

          if (
            !tr_acc ||
            !tr_pwd ||
            !tr_name ||
            !age ||
            !email ||
            !phone1 ||
            !address ||
            !tr_classtime ||
            !tr_course_id
          ) {
            message.text("請輸入完整資料!");
            return;
          }

          $("#teacherDataForm").submit();
        },
      },
    ],
  });
}

$("#tr_insetTimeButton").fireModal({
  title: `<span>新增老師授課時段</span>`,
  body: `
    <form id="search_tr_info" method="POST" action="/tr_insetTimeButton">
      <div class="form-group" style="margin-bottom: 15px;">
        <label for="search_tr_id">老師編號:</label>
        <div class="input-group">
          <input type="text" class="form-control" id="search_tr_id" name="search_tr_id">
          <div class="input-group-append">
            <button id="searchTeacherBtn" class="btn btn-primary" type="button">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>
        <br>
        <div class="form-group" style="margin-bottom: 15px;">
          <label for="search_tr_name">姓名:</label>
          <label id="search_tr_name"></label>
          <input type="input" style="display: none;" id="search_tr_course_id">
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
            <label for="search_classtime_id">授課時段</label>
            <div class="d-flex align-items-center">
              <select id="search_classtime_id" name="search_classtime_id" class="form-control" style="flex: 1; margin-right: 10px;">
                <option value="" selected disabled>請選擇授課時段</option>
              </select>
              <button id="tr_insetTimeButton_search" type="button" class="btn btn-primary">新增</button>
            </div>
          </div>
          <div class="form-group mt-3">
            <label id="tr_classtime_choose_search">已選授課時段：</label><br>
            <input type="text" style="display: none;" id="tr_classtimeid_choose_search" name="tr_classtimeid_choose_search"></input>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
              <label for="tr_st_num_insert" id="tr_classtime_st_num_insert">可接納學生數</label>
              <select id="tr_st_num_insert" name="tr_st_num_insert" class="form-control">
                <option value="8">8</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </select>
          </div>
        </div>
      </div>
      <span id="search_tr_info_msg" style="display: block; margin-bottom: .5rem; color: red;"></span>
    </form>
  `,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary btn-left", // 將取消按鈕置左
      handler: function (modal) {
        modal.modal("hide");
      },
    },
    {
      text: "確認",
      class: "btn btn-primary",
      handler: function () {
        const tr_id = $("#search_tr_id").val().trim();
        const tr_classtimeid_choose_search = $(
          "#tr_classtimeid_choose_search"
        ).val();
        if (!tr_id || !tr_classtimeid_choose_search) {
          $("#search_tr_info_msg").text("請選擇完整資料！");
        } else {
          $("#search_tr_info").submit();
        }
      },
    },
  ],
});

$("#returnStudentButton").fireModal({
  title: `<span>學生復學</span>`,
  body: `
<form id="returnStudentForm" method="POST" action="/returnStudentButton" style="margin-bottom: -45px;">
  <div style="margin-bottom: 15px;">
    <label for="st_id_return" style="font-weight: bold;">學號:</label>
    <span id="st_id_return" name="st_id_return"></span>
  </div>
  <div style="margin-bottom: 15px;">
    <label for="st_name_return" style="font-weight: bold;">姓名:</label>
    <span id="st_name_return"></span>
  </div>
  <input type="input" style="display: none" id="st_id_return_input" name="st_id">
</form>
`,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary",
      handler: function (modal) {
        modal.modal("hide");
      },
    },
    {
      text: "確認",
      class: "btn btn-danger",
      handler: function () {
        $("#st_id_return_input").val($("#st_id_return").text());
        $("#returnStudentForm").submit();
      },
    },
  ],
});

if (window.location.pathname === "/tr_index") {
  $("#tr_rollcall").fireModal({
    title: "學生點名紀錄",
    body: `
    <form id="trRollcallForm" method="POST" action="/tr_rollcall">
      <div class="row">
            <div class="col-md-12">
              <div class="form-group">
                <label for="address">點名時段</label>
                <select id="rollcall_time" name="rollcall_time" class="form-control">

                </select>
              </div>
            </div>
      </div>
      <span id=rollcall_msg></span>
      <input type="text" style="display:none" id="rollcall" name="rollcall">
      <input type="date" style="display:none" id="rollcall_date" name="rollcall_date">
    </form>
    `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          modal.modal("hide");
        },
      },
      {
        text: "送出",
        class: "btn btn-primary",
        handler: function () {
          const selectedClasstime = $("#rollcall_time").val(); // 獲取選中的時段
          let allStudentsMarked = true; // 假設所有學生都已點名

          // 遍歷 attendanceRecords 對象，檢查與選中時段相關的學生
          for (let studentId in attendanceRecords) {
            const student = attendanceRecords[studentId];
            if (
              student.classtime_id == selectedClasstime &&
              student.status == ""
            ) {
              allStudentsMarked = false; // 如果有學生未點名
              break; // 找到未點名的學生後停止檢查
            }
          }
          // 根據所有學生是否已點名，更新消息
          if (allStudentsMarked) {
            $("#rollcall_msg").text("確定送出點名紀錄");
            $("#rollcall").val(JSON.stringify(attendanceRecords));
            $("#trRollcallForm").submit();
          } else {
            $("#rollcall_msg").html(
              '<span style="color:red;">尚有學生未點名!</span>'
            );
            return;
          }
        },
      },
    ],
  });
}

$("#st_info").fireModal({
  size: "modal-lg",
  title: `<span>學生資訊</span>`,
  body: `
<form id="StudentInfoForm" method="POST" action="/st_info">
      <input type="input" style="display: none;" id="st_info_input_edit" name="st_info_input_edit">
      <div class="form-group">
        <img src="" id="st_info_picture" alt="上傳的圖片" style="max-width: 100px;">
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_info_name">學生姓名</label>
            <input type="text" id="st_info_name" name="st_info_name" class="form-control" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_info_age">年齡</label>
            <input type="number" id="st_info_age" name="st_info_age" class="form-control" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_info_course_name">學習進度</label>
            <input type="select" id="st_info_course_name" name="st_info_course_name" class="form-control" readonly style="pointer-events: none; background-color: #efeeee; border: none;"></input>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="st_info_phone1">連絡電話1</label>
            <input type="text" id="st_info_phone1" name="st_info_phone1" class="form-control" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-group">
              <label for="st_info_phone2">連絡電話2</label>
              <input type="text" id="st_info_phone2" name="st_info_phone2" class="form-control" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
          </div>
        </div>
      </div>  
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
            <label for="st_info_note">備註</label>
            <textarea id="st_info_note" name="st_info_note" class="form-control"></textarea>
          </div>
        </div>   
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
            <label for="st_info_create_date">入學日期</label>
            <input type="text" id="st_info_create_date" class="form-control" readonly style="pointer-events: none; background-color: #efeeee; border: none;">
          </div>
        </div>
      </div>
      <span id="StudenInfoMessage" style="display: block; margin-bottom: .5rem; color: red; margin: 0;"></span>
    </form>
`,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary",
      handler: function (modal) {
        modal.modal("hide");
      },
    },
    {
      text: "確認",
      class: "btn btn-primary",
      handler: function () {
        if ($("#st_info_note").val().length > 100) {
          $("#StudenInfoMessage").text("備註不能超過 100 字!");
          return;
        }
        $("#StudentInfoForm").submit();
      },
    },
  ],
});

if (window.location.pathname === "/st_note") {
  $("#editNoteButton").fireModal({
    title: `<span>新增學習紀錄</span>`,
    body: `
  <form id="StudentNoteForm" method="POST" action="/editNoteButton">
        <input style="display:none;" id="st_id" name="st_id">
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <label for="st_note_classtime">上課紀錄</label>
              <select type="select" id="st_note_classtime" name="st_note_classtime" class="form-control">
              <option value="" disabled selected>請選擇上課紀錄</option>
              ${note_todo
                .map(
                  (n) =>
                    `<option value="${
                      n.classtime_id +
                      " " +
                      moment(n.class_date).format("YYYY-MM-DD")
                    }">${n.class_schedule}</option>`
                )
                .join("")}
              </select>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <label for="st_note_course_id">學習課程</label>
              <select type="text" id="st_note_course_id" name="st_note_course_id" class="form-control">
                <option value="" disabled selected>請選擇學習課程</option>
                ${course_data
                  .map(
                    (c) =>
                      `<option value="${c.course_id}">${c.course_name}</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6">
              <div class="form-group">
                <label for="st_note_last_problems">最後題數</label>
                <input type="number" id="st_note_last_problems" name="st_note_last_problems" class="form-control">
              </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="st_note_problems">解題數</label>
              <input type="number" id="st_note_problems" name="st_note_problems" class="form-control">
            </div>
          </div>
        </div>  
        <span id="StudenNoteMessage" style="display: block; margin-bottom: .5rem; color: red; margin: 0;"></span>
      </form>
  `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          modal.modal("hide");
        },
      },
      {
        text: "確認",
        class: "btn btn-primary",
        handler: function () {
          if (
            !$("#st_note_classtime").val() ||
            !$("#st_note_course_id").val() ||
            !$("#st_note_last_problems").val() ||
            !$("#st_note_problems").val()
          ) {
            $("#StudenNoteMessage").text("請輸入完整資料!");
            return;
          }
          $("#StudentNoteForm").submit();
        },
      },
    ],
  });
}

$("#delete_money_btn").fireModal({
  title: `<span>刪除繳費紀錄</span>`,
  body: `
<form id="deleteMoneyForm" method="POST" action="/delete_money_btn" style="margin-bottom: -45px;">
  <div style="margin-bottom: 15px;">
    <label for="delete_money_st_id" style="font-weight: bold;">學號:</label>
    <span id="delete_money_st_id"></span>
  </div>
  <div style="margin-bottom: 15px;">
    <label for="delete_money_st_semester" style="font-weight: bold;">學期:</label>
    <span id="delete_money_st_semester"></span>
  </div>
  <input type="input" style="display: none" id="money_id" name="money_id">
  <input type="input" style="display: none" id="delete_money_st_id_input" name="delete_money_st_id_input">
  <input type="input" style="display: none" id="semester_id" name="semester_id">
  
</form>
`,
  buttons: [
    {
      text: "取消",
      class: "btn btn-secondary",
      handler: function (modal) {
        modal.modal("hide");
      },
    },
    {
      text: "確認",
      class: "btn btn-danger",
      handler: function () {
        $("#deleteMoneyForm").submit();
      },
    },
  ],
});

if (window.location.pathname === "/st_attend") {
  $("#editStudentAttendButton").fireModal({
    title: "修改學生出席紀錄",
    body: `
    <form id="st_attendForm" method="POST" action="/editStudentAttendButton">
      <div style="margin-bottom: 15px;">
        <label for="st_id_attend" style="font-weight: bold;">學號:</label>
        <span id="st_id_attend"></span>
      </div>
      <div style="margin-bottom: 15px;">
        <label for="st_name_attend" style="font-weight: bold;">姓名:</label>
        <span id="st_name_attend"></span>
      </div>
      <div style="margin-bottom: 15px;">
        <label for="st_date_attend" style="font-weight: bold;">上課日期:</label>
        <span id="st_date_attend"></span>
      </div>
      <div style="margin-bottom: 15px;">
        <label for="st_classroom_attend" style="font-weight: bold;">上課教室:</label>
        <span id="st_classroom_attend"></span>
      </div>
      <div style="margin-bottom: 15px;">
        <label for="st_classtime_attend" style="font-weight: bold;">上課時段:</label>
        <span id="st_classtime_attend" name="st_classtime_attend"></span>
      </div>
      <div style="margin-bottom: 15px;">
        <label for="st_tr_attend" style="font-weight: bold;">上課老師:</label>
        <span id="st_tr_attend" name="st_tr_attend"></span>
      </div>
      <div class="form-group">
        <label for="st_status_attend">上課紀錄</label>
        <select name="st_status_attend" class="form-control" id="st_status_attend">
          <option value="" disabled selected>請選擇上課紀錄</option>
          <option value="1">上課</option>
          <option value="2">請假</option>
          <option value="3">曠課</option>
          <option value="4">停課</option>
        </select>
      </div>
      <div class="form-group">
        <label for="st_tr2_attend">調整上課老師</label>
        <select name="st_tr2_attend" class="form-control" id="st_tr2_attend">
          <option value="" disabled selected>請選擇老師</option>
          ${tr_data
            .map(
              (t) =>
                `<option value="${t.tr_id}">${
                  t.tr_id + "-" + t.tr_name
                }</option>`
            )
            .join("")}
        </select>
      </div>
      <div class="form-group">
        <label for="st_course_attend">學習課程</label>
        <select name="st_course_attend" class="form-control" id="st_course_attend">
          <option value="" disabled selected>請選擇課程</option>  
        </select>
      </div>
      <div class="form-group">
        <label for="st_last_problem_attend">最後題數</label>
        <input type="number" name="st_last_problem_attend" class="form-control" id="st_last_problem_attend">
      </div>
      <div class="form-group">
        <label for="st_problems_attend">解題數</label>
        <input type="number" name="st_problems_attend" class="form-control" id="st_problems_attend">
      </div>
      <span id="st_attend_msg" name="st_attend_msg" style="color:red;"></span>

      <input style="display:none" id="st_attend_id" name="st_attend_id">
      <input style="display:none" id="st_id_attend_input" name="st_id_attend_input">
      <input style="display:none" id="st_date_attend_input" name="st_date_attend_input"> 
      <input style="display:none" id="st_classtime_id_attend" name="st_classtime_id_attend"> 
      
    </form>
  `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          // 當使用者點擊取消按鈕時，關閉模態框
          modal.modal("hide");
        },
      },
      {
        text: "確認",
        class: "btn btn-primary",
        handler: function (modal) {
          // 獲取表單數據
          var formData = $("#st_attendForm").serializeArray();

          // 將資料轉換為物件
          var formDataObj = {};
          formData.forEach(function (field) {
            formDataObj[field.name] = field.value.trim(); // 去掉前後空格
          });

          // 檢查三個欄位的值
          var st_course_attend = formDataObj["st_course_attend"];
          var st_last_problem_attend = formDataObj["st_last_problem_attend"];
          var st_problems_attend = formDataObj["st_problems_attend"];

          // 判斷是否全部為空或全部有值
          var allEmpty =
            !st_course_attend && !st_last_problem_attend && !st_problems_attend;
          var allFilled =
            st_course_attend && st_last_problem_attend && st_problems_attend;

          if (!allEmpty && !allFilled) {
            // 如果既不是全空，也不是全有，提示用戶
            $("#st_attend_msg").text("請填完整資料!");
            return; // 阻止後續邏輯執行
          }
          $("#st_attend_msg").text("");
          // 如果條件滿足，使用 AJAX 提交表單
          $.ajax({
            url: "/editStudentAttendButton", // 後端 URL
            method: "POST", // 請求方法
            contentType: "application/json", // 發送的資料類型
            data: JSON.stringify(formDataObj), // 發送的表單數據，轉換為 JSON
            success: function (response) {
              // 提交成功後的操作
              $("#searchInput").val(response["st_id"]);
              searchTable(); // 刷新表格
              console.log("成功提交:", response);
              modal.modal("hide"); // 隱藏模態框
            },
            error: function (xhr, status, error) {
              // 提交失敗的處理
              console.error("提交失敗:", error);
            },
          });
        },
      },
    ],
  });
}

if (window.location.pathname === "/ad_certificate") {
  $("#ad_cert_check").fireModal({
    title: "檢視學生證照",
    body: `
    <form id="adCertForm" method="POST" action="/ad_cert_check">
        <div class="form-group">
            <label for="cert_name">認證單位:</label>
            <span id="cert_name"></span>
        </div>
        <div class="form-group">
            <label for="cert_program">認證科目:</label>
            <span id="cert_program"></span>
        </div>
        <div class="form-group">
            <label for="cert_date">考照日期:</label>
            <span id="cert_date"></span>
        </div>
        <div class="form-group">
            <label for="cert_file">證照圖片:</label><br>
            <img src='' id="cert_file" alt="上傳的圖片" style="max-width: 100px; margin-bottom: .5rem;">
        </div>
        <input style="display:none" type="text" id="check_result" name="check_result">
        <input style="display:none" type="text" id="cert_id" name="cert_id">
        
    </form>
    
  `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary btn-left",
        handler: function (modal) {
          modal.modal("hide");
        },
      },
      {
        text: "不通過",
        class: "btn btn-danger",
        handler: function () {
          document.getElementById("check_result").value = "no";
          $("#adCertForm").submit();
        },
      },
      {
        text: "通過",
        class: "btn btn-primary",
        handler: function () {
          document.getElementById("check_result").value = "yes";
          $("#adCertForm").submit();
        },
      },
    ],
  });

  $("#ad_cert_delete").fireModal({
    title: "修改學生證照紀錄",
    body: `
    <form id="adCertDeleteForm" method="POST" action="/ad_cert_delete">
        <div class="form-group">
            <label for="cert_name_del">認證單位:</label>
            <span id="cert_name_del"></span>
        </div>
        <div class="form-group">
            <label for="cert_program_del">認證科目:</label>
            <span id="cert_program_del"></span>
        </div>
        <div class="form-group">
            <label for="cert_date_del">考照日期:</label>
            <span id="cert_date_del"></span>
        </div>
        <div class="form-group">
            <label for="cert_file_del">證照圖片:</label><br>
            <img src='' id="cert_file_del" alt="上傳的圖片" style="max-width: 100px; margin-bottom: .5rem;">
        </div>
        <input style="display:none" type="text" id="cert_id_del" name="cert_id_del">
        
    </form>
    
  `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          modal.modal("hide");
        },
      },
      {
        text: "不通過",
        class: "btn btn-danger",
        handler: function () {
          $("#adCertDeleteForm").submit();
        },
      },
    ],
  });
}

if (window.location.pathname === "/certificate") {
  // 初始化模態框
  $("#cert_btn").fireModal({
    title: "修改證照資料",
    body: `
    <form id="certForm" method="POST" action="/cert_edit" enctype="multipart/form-data">
        <div class="form-group">
            <label for="cert_name_edit">認證單位<span style="color: red;">*</span></label>
            <select class="form-control" id="cert_name_edit" name="cert_name_edit">
                <option value="" disabled selected>選擇認證單位</option>
                ${names
                  .map(
                    (name) => `
                  <option value="${name}">${name}</option>`
                  )
                  .join("")}
            </select>
        </div>
        <div class="form-group">
            <label for="cert_program_edit">認證科目<span style="color: red;">*</span></label>
            <select class="form-control" id="cert_program_edit" name="cert_program_edit">
                <option value="" disabled selected>選擇認證科目</option>
                ${programs
                  .map(
                    (program) => `
                  <option value="${program}">${program}</option>`
                  )
                  .join("")}
            </select>
        </div>
        <div class="form-group">
            <label for="cert_date_edit">考照日期<span style="color: red;">*</span></label>
            <input type="date" class="form-control" id="cert_date_edit" name="cert_date_edit" value=''>
        </div>
        <div class="form-group">
            <label for="file_edit">證照圖片<span style="color: red;">*</span></label><br>
            <img src='' id="uploadedImage_edit" alt="上傳的圖片" style="max-width: 100px; margin-bottom: .5rem; display: none">
            <span id="pic_msg_edit" style="display: block; margin-bottom: .5rem;"></span>
            <input type="file" name="file_edit" id="file_edit" style="display:none;" accept="image/png, image/jpeg, image/jpg, image/webp">
            <button type="button" id="uploadButton_edit" class="btn btn-primary">上傳照片</button>
        </div>
        <span id="submit_msg_edit" style="display: block; margin-bottom: .5rem; color: red;"></span>
        <input style="display:none" type="text" id="cert_id_edit" name="cert_id_edit">
    </form>
    <div id="cert_EditMessage"></div>
  `,
    buttons: [
      {
        text: "取消",
        class: "btn btn-secondary",
        handler: function (modal) {
          modal.modal("hide");
        },
      },
      {
        text: "送出",
        class: "btn btn-primary",
        handler: function () {
          const certName = document.getElementById("cert_name_edit").value;
          const certProgram =
            document.getElementById("cert_program_edit").value;
          const certDate = document.getElementById("cert_date_edit").value;

          // 檢查必填欄位
          if (!certName || !certProgram || !certDate) {
            $("#cert_EditMessage").html(
              '<span style="color:red;">請輸入完整的證照資料!</span>'
            );
            return; // 結束函數，防止提交
          }

          // 確保日期不超過今天
          const today = new Date();
          const selectedDate = new Date(certDate);
          if (selectedDate > today) {
            $("#cert_EditMessage").html(
              '<span style="color:red;">考照日期格式錯誤!</span>'
            );
            return; // 結束函數，防止提交
          }

          $("#certForm").submit();
        },
      },
    ],
  });

  // 點擊按鈕時填充資料
  document.querySelectorAll(".btn-outline-danger").forEach((button) => {
    button.addEventListener("click", function () {
      const certId = this.getAttribute("data-cert-id");

      // 從後臺獲取之前的上傳資料
      fetch(`/certificate/get_data?cert_id=${certId}`)
        .then((response) => response.json())
        .then((data) => {
          // 填充表單字段
          document.getElementById("cert_name_edit").value = data.cert_name;
          document.getElementById("cert_program_edit").value =
            data.cert_program;
          document.getElementById("cert_date_edit").value = data.cert_date;

          const filePreview = document.getElementById("file_edit");
          if (data.file_url) {
            filePreview.src = data.file_url;
            filePreview.style.display = "block";
          } else {
            filePreview.style.display = "none";
          }

          $("#cert_btn").click(); // 顯示模態框
        })
        .catch((error) => {
          console.error("獲取證照資料失敗:", error);
        });
    });
  });
}

$("#modal-1").fireModal({ body: "Modal body text goes here." });

$("#modal-2").fireModal({ body: "Modal body text goes here.", center: true });

let modal_3_body =
  '<p>Object to create a button on the modal.</p><pre class="language-javascript"><code>';
modal_3_body += "[\n";
modal_3_body += " {\n";
modal_3_body += "   text: 'Login',\n";
modal_3_body += "   submit: true,\n";
modal_3_body += "   class: 'btn btn-primary btn-shadow',\n";
modal_3_body += "   handler: function(modal) {\n";
modal_3_body += "     alert('Hello, you clicked me!');\n";
modal_3_body += "   }\n";
modal_3_body += " }\n";
modal_3_body += "]";
modal_3_body += "</code></pre>";
$("#modal-3").fireModal({
  title: "Modal with Buttons",
  body: modal_3_body,
  buttons: [
    {
      text: "Click, me!",
      class: "btn btn-primary btn-shadow",
      handler: function (modal) {
        alert("Hello, you clicked me!");
      },
    },
  ],
});

$("#modal-4").fireModal({
  footerClass: "bg-whitesmoke",
  body: "Add the <code>bg-whitesmoke</code> class to the <code>footerClass</code> option.",
  buttons: [
    {
      text: "No Action!",
      class: "btn btn-primary btn-shadow",
      handler: function (modal) {},
    },
  ],
});

$("#modal-5").fireModal({
  title: "Login",
  body: $("#modal-login-part"),
  footerClass: "bg-whitesmoke",
  autoFocus: false,
  onFormSubmit: function (modal, e, form) {
    // Form Data
    let form_data = $(e.target).serialize();
    console.log(form_data);

    // DO AJAX HERE
    let fake_ajax = setTimeout(function () {
      form.stopProgress();
      modal
        .find(".modal-body")
        .prepend(
          '<div class="alert alert-info">Please check your browser console</div>'
        );

      clearInterval(fake_ajax);
    }, 1500);

    e.preventDefault();
  },
  shown: function (modal, form) {
    console.log(form);
  },
  buttons: [
    {
      text: "Login",
      submit: true,
      class: "btn btn-primary btn-shadow",
      handler: function (modal) {},
    },
  ],
});

$("#modal-6").fireModal({
  body: "<p>Now you can see something on the left side of the footer.</p>",
  created: function (modal) {
    modal
      .find(".modal-footer")
      .prepend('<div class="mr-auto"><a href="#">I\'m a hyperlink!</a></div>');
  },
  buttons: [
    {
      text: "No Action",
      submit: true,
      class: "btn btn-primary btn-shadow",
      handler: function (modal) {},
    },
  ],
});

$(".oh-my-modal").fireModal({
  title: "My Modal",
  body: "This is cool plugin!",
});
