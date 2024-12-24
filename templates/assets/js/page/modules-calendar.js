"use strict";

// 初始化當前年份和月份
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
let selectedEvent = null; // 用於保存用戶點擊的事件

console.log(currentYear);

// 初始化 FullCalendar
$("#myEvent").fullCalendar({
  height: "auto",
  header: {
    left: "prev,next today",
    center: "title",
    right: "filterButton",
  },
  customButtons: {
    filterButton: {
      text: "Filter", // 設置占位元文本
      click: function () {
        $("#modalYearSelect").val(currentYear);
        $("#modalMonthSelect").val(currentMonth);
        $("#FilterModalButton").click();
      },
    },
  },
  dayClick: function (date) {
    const today = moment().format("YYYY-MM-DD");
    const classroomDateSelect = date.format("YYYY-MM-DD");
    end_class_date = moment(end_class_date).format("YYYY-MM-DD");
    if (classroomDateSelect <= today) {
      // 不可以選擇之前的日期進行排課
      $("#fc_scheduleError_1").click();
    } else {
      if (classroomDateSelect > end_class_date) {
        $("#fc_scheduleError_2").click();
      } else {
        $("#classroomDateSelect").val(classroomDateSelect);

        $("#fc_scheduleButton").click(); // 彈出排課選單
      }
    }
  },

  eventClick: function (event) {
    $("#fc_leaveDayDate").val(event.start.format("YYYY-MM-DD"));
    $("#fc_notLeaveDayDate").val(event.start.format("YYYY-MM-DD"));
    var selectedTitile = event.title.split("\n");

    if (event["status"] === "") {
      $("#fc_leaveDayClassroom").val(selectedTitile[0]);
      $("#fc_leaveDayClasstime").val(selectedTitile[1]);
      $("#fc_attend_id").val(event["attend_id"]);
      $("#fc_leaveButton").click();
    }
    if (event["status"] === "2") {
      $("#st_notLeaveMsg").text("");
      $("#fc_notLeaveDayClassroom").val(selectedTitile[0]);
      $("#fc_notLeaveDayClasstime").val(selectedTitile[1]);
      $("#fc_notAttend_id").val(event["attend_id"]);
      $("#fc_notLeaveButton").click();
    }
  },
  events: event_data,
  eventOrder: 'title.split("\n")[1]',
});

$(document).ready(function () {
  $(".fc-filterButton-button").html("<div class='ion-calendar'></div>");
});

// 填充年份選擇框
for (let year = currentYear - 3; year <= currentYear + 3; year++) {
  $("#modalYearSelect").append(`<option value="${year}">${year}</option>`);
}
for (let month = 0; month < 12; month++) {
  $("#modalMonthSelect").append(
    `<option value="${month}">${month + 1}月</option>`
  );
}

// 送出篩選年、月份
$("#applyFilters").on("click", function () {
  const year = $("#modalYearSelect").val();
  const month = $("#modalMonthSelect").val();
  $("#myEvent").fullCalendar(
    "gotoDate",
    `${year}-${String(parseInt(month) + 1).padStart(2, "0")}-01`
  );
});
