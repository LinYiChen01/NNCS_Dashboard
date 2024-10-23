"use strict";

// var classroom_area = '';

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
  // 延遲顯示模態窗口，以確保清空表單操作完成
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
          const fc_timeslotSelect = $("#fc_timeslotSelect").val();

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
        const matchingRecord = classroom_attend_data.find(
          (attend) =>
            attend.classtime_id === item.classtime_id &&
            attend.class_date === $("#classroomDateSelect").val()
        );

        if (matchingRecord) {
          currentAttendanceText = ` (額滿)`;
        }

        const classTime = `星期${item.class_week} ${item.start_time}-${item.end_time}${currentAttendanceText}`;
        classTimes.push(classTime);
      }
    });

    // 根據篩選的結果來填充時段選擇框
    $("#fc_timeslotSelect")
      .empty()
      .append('<option value="" disabled selected>請選擇上課時段</option>')
      .append(
        classTimes.map((time) => {
          // 判斷是否為額滿，然後根據條件添加樣式和 disabled
          const isFull = time.includes("(額滿)"); // 檢查是否包含 "(額滿)"
          return `<option value="${time}" style="${
            isFull ? "color: red;" : ""
          }" ${isFull ? "disabled" : ""}>${time}</option>`;
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
      class: "btn btn-secondary",
      handler: function (modal) {
        // 当用户点击取消按钮时，关闭模态框
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

function clearupdateForm() {
  $("#updateForm")[0].reset();
  $("#pic_msg").text("");
  $("#submit_msg").text("");
  $("#uploadedImage").attr("src", picture);
  $("#uploadedImage").show();
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

$("#loginFailure2").fireModal({
  title: '<span style="color:#f36969;">登入失敗❌<span style="color:red;">',
  body: "您的帳號已被停權，如有疑問請與我們聯繫!",
});

if (window.location.pathname === "/certificate") {
  $("#cert_updateDataButton").fireModal({
    title: "上傳證照",
    body: `
    <form id="updateForm" method="POST" action="/cert_updateDataButton" enctype="multipart/form-data">
        <div class="form-group">
            <label for="cert_name">認證單位<span style="color: red;">*</span></label>
            <input type="text" id="cert_name_hidden" name="cert_name_hidden" style="display:none;">
            <select class="form-control" id="cert_name" name="cert_name" onchange="toggleCustomCertName()">
                <option value="" disabled selected>選擇認證單位</option>
                ${names
                  .map(
                    (name) => `
                  <option value="${name}">${name}</option>`
                  )
                  .join("")}
                <option value="其他">其他</option>
            </select>
            <input type="text" class="form-control mt-2" id="cert_name_other" name="cert_name_other" placeholder="請輸入認證單位" style="display:none;">
        </div>
        <div class="form-group">
            <label for="cert_program">認證科目<span style="color: red;">*</span></label>
            <input type="text" id="cert_program_hidden" name="cert_program_hidden" style="display:none;">
            <select class="form-control" id="cert_program" name="cert_program" onchange="toggleCustomCertProgram()">
                <option value="" disabled selected>選擇認證科目</option>
                ${programs
                  .map(
                    (program) => `
                  <option value="${program}">${program}</option>`
                  )
                  .join("")}
                <option value="其他">其他</option>
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
            (certName === "其他" &&
              !document.getElementById("cert_name_other").value) ||
            !certProgram ||
            (certProgram === "其他" &&
              !document.getElementById("cert_program_other").value) ||
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

          // 檢查 "其他" 輸入是否與現有選項重複
          let finalCertName = certName;
          let finalCertProgram = certProgram;

          if (certName === "其他") {
            finalCertName = document.getElementById("cert_name_other").value;

            // 檢查是否重複，忽略大小寫
            const isDuplicateCertName = names.some(
              (name) => name.toLowerCase() === finalCertName.toLowerCase()
            );
            if (isDuplicateCertName) {
              $("#cert_updateDataMessage").html(
                '<span style="color:red;">此認證單位已存在，請從下拉選單中選擇!</span>'
              );
              return; // 結束函數，防止提交
            }
          }

          if (certProgram === "其他") {
            finalCertProgram =
              document.getElementById("cert_program_other").value;

            // 檢查是否重複，忽略大小寫
            const isDuplicateCertProgram = programs.some(
              (program) =>
                program.toLowerCase() === finalCertProgram.toLowerCase()
            );
            if (isDuplicateCertProgram) {
              $("#cert_updateDataMessage").html(
                '<span style="color:red;">此認證科目已存在，請從下拉選單中選擇!</span>'
              );
              return; // 結束函數，防止提交
            }
          }

          // 如果所有驗證都通過，進行提交
          document.getElementById("cert_name_hidden").value = finalCertName;
          document.getElementById("cert_program_hidden").value =
            finalCertProgram;

          // $("#updateForm").submit();
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
                ${course_name_data.map(course => `<option value="${course.course_id}">${course.name}</option>`).join('')}
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

          if (!userId || !age || !email || !phone1 || !tuition || !address || !parent || !workplace || !profession) {
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
  const textarea = document.getElementById('note');
  textarea.addEventListener('input', function () {
    // 設置高度並強制使用 !important
    this.setAttribute('style', `height: ${this.scrollHeight}px !important;`);
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
            <input type="text" id="st_pwd_edit" name="st_pwd" class="form-control">
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
          const Message = $('#editStudenMessage');
          $('#st_id_input_edit').val($('#st_id_edit').text());
          const stName = $('#st_name_edit').val().trim();
          const stAge = $('#st_age_edit').val();
          const stAcc = $('#st_acc_edit').val().trim();
          const stPwd = $('#st_pwd_edit').val().trim();
          const stCourseId = $('#st_course_name_edit').val();
          const stTuition = $('#st_tuition_edit').val();
          const stParent = $('#st_parent_edit').val().trim();
          const stPhone1 = $('#st_phone1_edit').val().trim();
          const stEmail = $('#st_email_edit').val().trim();
          const stAddress = $('#st_address_edit').val().trim();
          const stWorkplace = $('#st_workplace_edit').val().trim();
          const stProfession = $('#st_profession_edit').val().trim();
          const stNote = $('#st_note_edit').val().trim();
          
          Message.text("");
          // 檢查所有必填字段
          if (!stName || !stAge || !stAcc || !stPwd || !stTuition || !stParent || !stPhone1 || !stEmail || !stAddress || !stWorkplace || !stProfession) {
            Message.text("請輸入完整資料!");
            return;
          }

          // 驗證 email 格式
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(stEmail)) {
            Message.text("請輸入有效的 Email 地址。");
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
          $("#st_id_leave_input").val($("#st_id_leave").text())
          $("#leaveStudentForm").submit();
        },
      },
    ],
  });
}

$("#st_scheduleButton").fireModal({
  title: `<span>安排學生上課時段</span>`,
  body: `
    <form id="search_st_info" method="POST" action="/search_st_info">
      <div class="form-group" style="margin-bottom: 15px;">
        <label for="search_st_id">學號:</label>
        <div class="input-group">
          <input type="text" class="form-control" id="search_st_id">
          <div class="input-group-append">
            <button id="searchStudentBtn" class="btn btn-primary" type="button">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>
        <br>
        <div class="form-group" style="margin-bottom: 15px;">
          <label for="search_st_name">姓名:</label>
          <label id="search_st_name"></label> <!-- 显示学生姓名的标签 -->
          <input type="input" style="display: none;" id="search_st_course_id">
        </div>
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
      class: "btn btn-primary",
      handler: function (modal) {
        // 提交表单时，隐藏的学生 ID 会传递
        $("#st_id_leave_input").val($("#search_st_id").val());
        $("#scheduleForm").submit();
      },
    },
  ],
});


$("#edit_st_scheduleButton").fireModal({
  title: `<span>編輯學生資訊</span>`,
  body: `
    <form id="leaveStudentForm" method="POST" action="/leaveStudentButton">
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
      class: "btn btn-primary",
      handler: function (modal) {
        $("#st_id_leave_input").val($("#st_id_leave").text())
        $("#leaveStudentForm").submit();
      },
    },
  ],
});



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
