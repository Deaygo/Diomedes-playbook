/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/
/*jslint white: false */
/*jslint nomen: false */
/*jslint plusplus: false */
/*jslint passfail: true */
/*global window, dojo, util */

dojo.provide("diom.topics");

var diom;
if (!diom) {
  diom = { };
}

diom.topics = {

  NOTIFY: "/notify/",

  CHANNELS_CHANGED: "/channels/changed/",
  CHANNEL_SELECTED: "/channel/selected/",
  CHANNEL_ACTIVITY: "/channel/activity/",
  CHANNEL_ADD: "/channel/add/",
  CHANNEL_DELETE: "/channel/delete/",
  CHANNLE_TOPIC: "/channel/topic/",
  CHANNEL_CLOSE: "/channel/close/",

  CONNECTION_DISCONNECTED: "/connection/disconnected",
  CONNECTION_CLOSE: "/connection/close",

  USER_ACTIVITY: "/user/activity",
  USER_INPUT: "/user/input/",
  USER_HIGHLIGHT: "/user/highlight/",

  UPDATE_CHECK: "/update/check/",
  UPDATE_DELAY_CHANGE: "/update/delay/change/",
  UPDATE_URL_CHANGE: "/update/url/change/",
  UPDATE_NO_NEW_UPDATES: "/update/no/new/updates/",

  INPUT_PAGE_UP: "input/page/up",
  INPUT_PAGE_DOWN: "input/page/down",
  INPUT_CHANNEL_PART: "/input/channel/part",
  INPUT_CHANNEL_NEXT: "/input/channel/next",
  INPUT_CHANNEL_PREV: "/input/channel/prev",
  INPUT_CHANNEL_INDEX: "/input/channel/index",

  NICK_CHANGE: "/nick/change/",

  PREFS_SAVE: "/prefs/save/",
  PREFS_CHANGE_HISTORY_LENGTH: "/prefs/change/history/length/",
  PREFS_CHANGE_FONT: "/prefs/change/font/",
  PREFS_CHANGE_TIME_FORMAT: "/prefs/change/time/format/",
  PREFS_CHANGE_THEME: "/prefs/change/theme/",
  PREFS_CHANGE_AUTOJOIN: "/prefs/change/autojoin/",
  PREFS_CHANGE_LOGGING: "/prefs/change/logging/",
  PREFS_CHANGE_PING_SERVER: "/prefs/change/ping_server/",

  LINK_FOUND: "/link/found",
  LINK_DATA: "/link/data/",
  LINK_GET_INFO: "/link/get/info",
  LINK_SHOW_INFO: "/link/show/info",

  NETWORK_ADD: "/network/add/",
  NETWORK_EDIT: "/network/edit/",
  NETWORK_DELETE: "/network/delete/",
  NETWORK_CHANGE: "/network/change/",
  NETWORK_CLOSE: "/network/close/",

  SERVER_ADD: "/server/add/",
  SERVER_EDIT: "/server/edit/",
  SERVER_DELETE: "/server/delete/",

  PERFORM_ADD: "/perform/add/",
  PERFORM_EDIT: "/perform/edit/",
  PERFORM_DELETE: "/perform/delete/",

  ALIAS_ADD: "/alias/add/",
  ALIAS_EDIT: "/alias/edit/",
  ALIAS_DELETE: "/alias/delete",
  ALIAS_CHANGE: "/alias/change/",

  IGNORE_ADD: "/ignore/add/",
  IGNORE_EDIT: "/ignore/edit/",
  IGNORE_DELETE: "/ignore/delete",
  IGNORES_CHANGE: "/ignores/change/",
  IGNORES_UPDATE: "/ignores/update/",

  NICK_LIST_TOGGLE: "/nick/list/toggle",

  POPUP_CLOSE: "/popup/close/"
};

