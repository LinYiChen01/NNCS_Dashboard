"use strict";

// 初始化当前年份和月份
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

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
      click: function() {
        $('#filterModal').modal('show');
      }
    }
  },
  dayClick: function (date) {
    $('#courseModal').data('selectedDate', date.format());
    $('#selectedDate').val(date.format('YYYY-MM-DD'));
    $('#courseModal').modal('show');
  },
  events: [
    {
      title: 'Conference',
      start: '2024-08-09',
      end: '2024-08-11',
      backgroundColor: "#fff",
      borderColor: "red",
      textColor: 'red'
    },
    {
      title: "John's Birthday",
      start: '2018-01-14',
      backgroundColor: "#007bff",
      borderColor: "#007bff",
      textColor: '#fff'
    },
    {
      title: 'Reporting',
      start: '2018-01-10T11:30:00',
      backgroundColor: "#f56954",
      borderColor: "#f56954",
      textColor: '#fff'
    },
    {
      title: 'Starting New Project',
      start: '2018-01-11',
      backgroundColor: "#ffc107",
      borderColor: "#ffc107",
      textColor: '#fff'
    },
    {
      title: 'Social Distortion Concert',
      start: '2018-01-24',
      end: '2018-01-27',
      backgroundColor: "#000",
      borderColor: "#000",
      textColor: '#fff'
    },
    {
      title: 'Lunch',
      start: '2018-01-24T13:15:00',
      backgroundColor: "#fff",
      borderColor: "#fff",
      textColor: '#000',
    },
    {
      title: 'Company Trip',
      start: '2018-01-28',
      end: '2018-01-31',
      backgroundColor: "#fff",
      borderColor: "#fff",
      textColor: '#000',
    },
  ]
});

// 点击“我要排课”按钮
$('#scheduleButton').on('click', function() {
  // 清空之前的数据
  $('#scheduleDate').val('');
  $('#scheduleCourse').val('');
  $('#scheduleMessage').text('');
  $('#scheduleModal').modal('show');
});

// 保存排课
$('#saveSchedule').on('click', function() {
  const selectedDate = $('#scheduleDate').val();
  const selectedCourse = $('#scheduleCourse').val();

  if (selectedDate && selectedCourse) { 
    const event = {
      title: selectedCourse,
      start: selectedDate,
      allDay: true,
      borderColor: "#6777ef",
      backgroundColor: "#fff",
      textColor: '#6777ef',
      category: selectedCourse
    };

    // 显示事件到 FullCalendar
    $('#myEvent').fullCalendar('renderEvent', event, true);
    $('#scheduleModal').modal('hide');
  } else { 
    // 显示错误信息
    $('#scheduleMessage').text('请選擇上课日期或课程').css('color', '#f36969');
  }
});

// 当选择日期时，跳转到相应的日期
$('#dateInput').on('change', function() {
  const selectedDate = $(this).val();
  $('#myEvent').fullCalendar('gotoDate', selectedDate);
});

// 保存课程选择
$('#saveCourse').on('click', function() {
  const selectedDate = $('#courseModal').data('selectedDate');
  const selectedCourse = $('#courseSelect').val();
  $('#myEvent').fullCalendar('renderEvent', {
    title: selectedCourse,
    start: selectedDate,
    allDay: true,
    borderColor: "#6777ef",
    backgroundColor: "#fff",
    textColor: '#6777ef'
  });
  $('#courseModal').modal('hide');
});

// 当弹出筛选模态框时清空数据
$(document).ready(function() {
  // 手动修改按钮的 HTML
  $('.fc-filterButton-button').html("<div class='ion-calendar'></div>");

  // 当筛选模态框弹出时清空选择框
  $('#filterModal').on('shown.bs.modal', function() {
    $('#modalYearSelect').val(currentYear);
    $('#modalMonthSelect').val(currentMonth);
  });
});

// 填充年份选择框
for (let year = currentYear - 10; year <= currentYear + 10; year++) {
  $('#modalYearSelect').append(`<option value="${year}">${year}</option>`);
}
for (let month = 0; month < 12; month++) {
  $('#modalMonthSelect').append(`<option value="${month}">${month+1}月</option>`);
}

// 应用筛选
$('#applyFilters').on('click', function() {
  const year = $('#modalYearSelect').val();
  const month = $('#modalMonthSelect').val();
  $('#myEvent').fullCalendar('gotoDate', `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`);
  $('#filterModal').modal('hide');
});
