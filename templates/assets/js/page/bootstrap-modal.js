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
    <form>
      <div class="form-group">
        <label for="leaveDate">開始日期</label>
        <input type="date" class="form-control" id="leaveDate">
      </div>
      <div class="form-group">
        <label for="endDate">結束日期</label>
        <input type="date" class="form-control" id="endDate">
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
        // 確認請假時的處理邏輯
        const leaveDate = $("#leaveDate").val();
        const endDate = $("#endDate").val();

        // 檢查是否有空的欄位
        if (!leaveDate || !endDate) {
          $("#leaveMessage").html(
            '<span style="color:red;">開始日期與結束日期不能為空！</span>'
          );
          return;
        }

        // 檢查結束日期是否早於開始日期
        if (new Date(endDate) < new Date(leaveDate)) {
          $("#leaveMessage").html(
            '<span style="color:red;">結束日期不能早於開始日期！</span>'
          );
          return;
        }

        // 正確填寫後顯示成功訊息
        modal.modal("hide");
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
    <form id="scheduleForm">
      <div class="form-group">
        <label for="classroomAreaSelect">上課地點</label>
        <select class="form-control" id="classroomAreaSelect">
          <option value="" disabled selected>請選擇上課地點</option>
          ${classroom_area
            .map((c) => `<option value="${c}">${c}</option>`)
            .join("")}
        </select>
      </div>
      <div class="form-group" id="classroomSelectGroup">
        <label for="classroomSelect">上課教室</label>
        <select class="form-control" id="classroomSelect">
        </select>
      </div>
      <div class="form-group" id="timeslotSelectGroup">
        <label for="timeslotSelect">上課時段</label>
        <select class="form-control" id="timeslotSelect">
        </select>
      </div>
      <div class="form-group" id="classNumSelectGroup">
        <label for="classNumSelect">上課堂數</label>
        <select class="form-control" id="classNumSelect">
          <option value="" disabled selected>請選擇上課堂數</option>
          <option value="0">補完剩下堂數</option>
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
          if ($("#classNumSelect").val() === "0") { 
            classNumSelect = 20 - class_num;
          }
          

          // 檢查是否有空的欄位
          if (!classroomAreaSelect || !classroomSelect || !timeslotSelect || !classNumSelect) {
            $("#scheduleMessage").html(
              '<span style="color:red;">請選擇完整的排課資料</span>'
            );
            return;
          } else { 
            if (classNumSelect + class_num <= 2) {
              $("#scheduleForm").submit();
            } else { 
              $("#scheduleMessage").html(
                `<span style="color:red;">您目前安排上課堂數為${class_num}堂，剩下${20-class_num}堂可以安排上課!</span>`
              );
              return;
            }

            
          }

          modal.modal("hide");
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
    $("#timeslotSelectGroup").hide();
    $("#classNumSelectGroup").hide();
  } else {
    // Hide classroom select and timeslot select
    $("#classroomSelectGroup").hide();
    $("#timeslotSelectGroup").hide();
    $("#classNumSelectGroup").hide();
    
  }
});

// When the classroom is selected
$("#classroomSelect").on("change", function () {
  const selectedClassroom = $(this).val();

  if (selectedClassroom) {
    // Create a Set to store unique time slots
    const classTimes = new Set();

    // Filter and process the data
    classroom_data.forEach((item) => {
      if (item.classroom === selectedClassroom) {
        const classTime = `星期${item.class_week} ${item.start_time}-${item.end_time}`;
        classTimes.add(classTime); // Add to Set to ensure uniqueness
      }
    });

    // Populate the timeslot select element
    $("#timeslotSelect")
      .empty()
      .append('<option value="" disabled selected>請選擇上課時段</option>')
      .append(
        [...classTimes].map(
          (time, index) => `<option value="timeslot${index}">${time}</option>`
        )
      );

    // Show the timeslot select group
    $("#timeslotSelectGroup").show();
    $("#classNumSelectGroup").hide();
  } else {
    // Hide the timeslot select group if no classroom is selected
    $("#timeslotSelectGroup").hide();
    $("#classNumSelectGroup").hide();
  }
});

$("#timeslotSelect").on("change", function () {
  if ($(this).val()) {
    // Show class number select when a timeslot is selected
    $("#classNumSelectGroup").show();

  } else {
    // Hide class number select if no timeslot is selected
    $("#classNumSelectGroup").hide();
  }
});

// $("#classNumSelect").on("change", function () {
//   const selectedClassNum = $(this).val();

//   if (selectedClassNum) {
//     $("#classNumSelectGroup").show();
//   } else {
//     // Hide the timeslot select group if no classroom is selected
//     $("#classNumSelectGroup").hide();
//   }
// });

// 清空排課表單內容函式
function clearScheduleForm() {
  $("#classroomAreaSelect").val(""); // 清空上課地點
  $("#classroomSelect").empty(); // 清空上課教室選擇
  $("#classroomSelectGroup").hide(); // 隱藏上課教室選擇
  $("#timeslotSelect").empty(); // 清空上課時段選擇
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
if (window.location.pathname === '/index') {
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
            // 如果排課資料完整，將事件添加到日曆中
            // const event = {
            //   title: `${
            //     fc_classroomSelect + "\n" + fc_timeslotSelect.split(" ")[1]
            //   }`,
            //   start: classroomDateSelect, // 日期
            //   end: classroomDateSelect,
            //   allDay: true, // 是否整天事件
            //   borderColor: "#6777ef",
            //   backgroundColor: "#fff",
            //   textColor: "#6777ef",
            // };
            
            // // 取得現有的 events 資料，將新的事件添加到其中
            // const eventData = JSON.parse(
            //   document.getElementById("eventData").getAttribute("data-events")
            // );
            // eventData.push(event);

            // // 儲存回 HTML 元素
            // document.getElementById("eventData").setAttribute("data-events", JSON.stringify(eventData));
            if (class_num <= 20) {
              $("#fc_scheduleForm").submit(); // 確保這行代碼執行
            }
            else { 
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
};

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

// When the classroom is selected
$("#fc_classroomSelect").on("change", function () {
  const selectedClassroom = $(this).val();
  const selectedDate = new Date($("#classroomDateSelect").val());

  // 取得選擇的日期的星期幾 (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const selectedWeekdayNumber = selectedDate.getDay();

  // 建立一個對應的中文星期對照表
  const weekdayMap = {
    0: "日", // 0 對應「日」
    1: "一", // 1 對應「一」
    2: "二", // 2 對應「二」
    3: "三", // 3 對應「三」
    4: "四", // 4 對應「四」
    5: "五", // 5 對應「五」
    6: "六", // 6 對應「六」
  };

  const selectedWeekdayChinese = weekdayMap[selectedWeekdayNumber];

  if (selectedClassroom && selectedWeekdayChinese) {
    // 創建一個 Set 用來存儲唯一的上課時段
    const classTimes = [];

    // 過濾並處理資料
    classroom_data.forEach((item) => {
      // 確認教室符合，並且 class_week (中文「一、二、三...七」) 對應到選擇的日期
      if (
        item.classroom === selectedClassroom &&
        item.class_week === selectedWeekdayChinese
      ) {
        const classTime = `星期${item.class_week} ${item.start_time}-${item.end_time}`;
        classTimes.push(classTime); // 添加到 Set 中，確保唯一性
      }
    });

    // 根據篩選的結果來填充時段選擇框
    $("#fc_timeslotSelect")
      .empty()
      .append('<option value="" disabled selected>請選擇上課時段</option>')
      .append(
        [...classTimes].map(
          (time) => `<option value="${time}">${time}</option>`
        )
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
        // $('#fc_attend_id').val('');
        // $('#fc_event_data').val(JSON.stringify(event_data));

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
        // $('#fc_event_data').val(JSON.stringify(event_data));
        // $('#fc_attend_id').val('');
        modal.modal("hide");
      },
    },
  ],
});

$("#updateDataButton").on("click", function () {
  clearupdateForm();
});

if (window.location.pathname === '/profiles') {
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
};

function clearupdateForm() {
  $("#updateForm")[0].reset();
  $("#pic_msg").text("");
  $("#submit_msg").text("");
  $("#uploadedImage").attr("src", picture);
  $("#uploadedImage").show();
};

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
