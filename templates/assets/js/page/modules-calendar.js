"use strict";

// 初始化当前年份和月份
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
let selectedEvent = null; // 用于保存用户点击的事件

console.log(currentYear);

// 初始化 FullCalendar
$("#myEvent").fullCalendar({
  height: 'auto',
  header: {
    left: 'prev,next today',
    center: 'title',
    right: 'filterButton'
  },
  customButtons: {
    filterButton: {
      text: 'Filter', // 设置占位文本
      click: function () {
        $('#modalYearSelect').val(currentYear);
        $('#modalMonthSelect').val(currentMonth);
        $("#FilterModalButton").click();
      }
    }
  },
  dayClick: function (date) {
    // 紀錄選擇的日期
    $('#classroomDateSelect').val(date.format('YYYY-MM-DD'));
    $('#fc_scheduleButton').click();
    
  },

  eventClick: function (event) {
    $('#fc_leaveDayDate').val(event.start.format('YYYY-MM-DD'));
    var selectedTitile = event.title.split('\n');
    $('#fc_leaveDayClassroom').val(selectedTitile[0]);
    $('#fc_leaveDayClasstime').val(selectedTitile[1]);
    $('#fc_attend_id').val(event['attend_id']);
    if (event['status'] === '') {
      $('#fc_leaveButton').click();
  }
  },
  events: event_data,
});


// $('#confirmLeave').on('click', function () { 
//   const leaveDate = $('#leaveDate').val(); // 获取选择的日期
//   const leaveCourse = $('#leaveCourse').val(); // 获取选择的课程

//   // 判断是否已选择日期和课程
//   if (leaveDate && leaveCourse) { 
//     // 删除与选择的日期和课程匹配的事件
//     $('#myEvent').fullCalendar('removeEvents', function(event) {
//       // 根据事件的标题和日期来匹配
//       return event.title === leaveCourse && event.start.format('YYYY-MM-DD') === leaveDate;
//     });
    
//     // 隐藏模态框
//     $('#leaveModal').modal('hide');
//   } else {
//     // 如果没有选择日期或课程，显示错误信息
//     $('#leaveMessage').text('请选择日期和课程').css('color', '#f36969');
//   }
// });

// $('#confirmDayLeave').on('click', function () { 
//   if (selectedEvent) { // 确保已选择了事件
//     // 删除用户点击的事件
//     $('#myEvent').fullCalendar('removeEvents', function(event) {
//       return event._id === selectedEvent._id; // 只删除匹配的事件
//     });
//     $('#leaveDayModal').modal('hide'); // 隐藏模态框
//     selectedEvent = null; // 清空 selectedEvent 变量
//   } else {
//     // 显示错误信息
//     $('#leaveDayMessage').text('请选择日期和课程').css('color', '#f36969');
//   }
// });

// 保存课程选择
// $('#saveCourse').on('click', function() {
//   const selectedDate = $('#courseDayModal').data('selectedDate');
//   const selectedCourse = $('#courseSelect').val();
//   $('#myEvent').fullCalendar('renderEvent', {
//     title: selectedCourse,
//     start: selectedDate,
//     allDay: true,
//     borderColor: "#6777ef",
//     backgroundColor: "#fff",
//     textColor: '#6777ef'
//   });
//   $('#courseDayModal').modal('hide');
// });

// 当弹出筛选模态框时清空数据


$(document).ready(function () {
  // 手动修改按钮的 HTML
  $('.fc-filterButton-button').html("<div class='ion-calendar'></div>");
});

// 填充年份选择框
for (let year = currentYear - 10; year <= currentYear + 10; year++) {
  $('#modalYearSelect').append(`<option value="${year}">${year}</option>`);
}
for (let month = 0; month < 12; month++) {
  $('#modalMonthSelect').append(`<option value="${month}">${month+1}月</option>`);
}

// 送出篩選年、月份
$('#applyFilters').on('click', function() {
  const year = $('#modalYearSelect').val();
  const month = $('#modalMonthSelect').val();
  $('#myEvent').fullCalendar('gotoDate', `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`);
});
