﻿function refreshCap() {
    DrawCaptcha();
}

function DrawCaptcha() {
    var a = Math.ceil(Math.random() * 10) + '';
    var b = Math.ceil(Math.random() * 10) + '';
    var c = Math.ceil(Math.random() * 10) + '';
    var d = Math.ceil(Math.random() * 10) + '';
    var e = Math.ceil(Math.random() * 10) + '';
    var f = Math.ceil(Math.random() * 10) + '';
    var g = Math.ceil(Math.random() * 10) + '';
    var code = a + ' ' + b + ' ' + ' ' + c + ' ' + d + ' ' + e + ' ' + f + ' ' + g;
    var test = document.getElementById("ContentPlaceHolder1_txtCapcha").value = code;
}

function ValidCaptcha() {
    var str1 = removeSpaces(document.getElementById('ContentPlaceHolder1_txtCapcha').value);
    var str2 = removeSpaces(document.getElementById('ContentPlaceHolder1_txtinputCapcha').value);
    if (str1 != str2) {
        alert("Properly enter the Security code.");
        document.getElementById('ContentPlaceHolder1_txtinputCapcha').focus(); return false;
    }
}

function removeSpaces(string) {
    return string.split(' ').join('');
}