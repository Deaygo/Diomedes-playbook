/*
  Copyright (c) 2009 Apphacker apphacker@gmail.com
*/

var topics;

if(!topics) {

  topics = {

    CHANNELS_CHANGED: "/channels/changed/",
    CHANNEL_SELECTED: "/channel/selected/",
    CHANNEL_ACTIVITY: "/channel/activity/",

    CONNECTION_DISCONNECTED: "/connection/disconnected",
    CONNECTION_CLOSE: "/connection/close",

    USER_ACTIVITY: "/user/activity",
    USER_INPUT: "/user/input/",
    USER_HIGHLIGHT: "/user/highlight/",

    NICK_CHANGE: "/nick/change/",

    PREFS_SAVE: "/prefs/save/",
    PREFS_CHANGE_HISTORY_LENGTH: "/prefs/change/history/length/",

    NETWORK_ADD: "/network/add/",
    NETWORK_EDIT: "/network/edit/",
    NETWORK_DELETE: "/network/delete/",
    NETWORK_CHANGE: "/network/change/",

    SERVER_ADD: "/server/add/",
    SERVER_EDIT: "/server/edit/",
    SERVER_DELETE: "/server/delete/",

    CHANNEL_ADD: "/channel/add/",
    CHANNEL_DELETE: "/channel/delete/",

    PERFORM_ADD: "/perform/add/",
    PERFORM_EDIT: "/perform/edit/",
    PERFORM_DELETE: "/perform/delete/",

    ALIAS_ADD: "/alias/add/",
    ALIAS_EDIT: "/alias/edit/",
    ALIAS_DELETE: "/alias/delete",
    ALIAS_CHANGE: "/alias/change/",

  };
}

