"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.Query = exports.JhokeClient = void 0;
var axios_1 = require("axios");
function getIndicesOf(searchStr, str) {
    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
        return [];
    }
    var startIndex = 0;
    var index;
    var indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}
var Query = function (Query, data) {
    var query = {
        where: __assign({ $has: [] }, Query.where),
        update: __assign({ $delete: false, $deleteKeys: [], $upsert: false }, Query.update)
    };
    /**
     * query consist of: identifier, (optionally) new data
     */
    var currenttext = data;
    var lb = getIndicesOf("\n", currenttext);
    var searchParams = __spreadArray(__spreadArray([], (query.where.$has ? query.where.$has.map(function (has) { return "\"".concat(has, "\":\""); }) : []), true), Object.keys(query.where).filter(function (key) { return !key.includes("$"); }).map(function (key) { return "\"".concat(key, "\":").concat(JSON.stringify(query.where[key])); }), true);
    var hits = [];
    var updated = [];
    var updatedWhole = data;
    searchParams.forEach(function (param) {
        var occs = getIndicesOf(param, currenttext);
        var lines = occs.map(function (occ) {
            var larger = lb.filter(function (val) { return val > occ; }).sort(function (a, b) { return a - b; })[0];
            var smaller = lb.filter(function (val) { return val < occ; }).sort(function (a, b) { return b - a; })[0] || 0;
            var curr = currenttext.substring(smaller, larger);
            var err = searchParams.map(function (p) {
                return curr.includes(p);
            });
            if (err.includes(false)) {
                return "error";
            }
            data = data.replace(curr, "");
            return JSON.parse(curr);
        });
        if (lines.includes("error")) {
            return;
        }
        var newlines = (query.update.$delete) ? [] : lines.map(function (obj) {
            var newobj = {};
            Object.keys(query.update).filter(function (key) { return !key.includes("$"); }).forEach(function (key) {
                newobj[key] = query.update[key];
            });
            return __assign(__assign({}, obj), newobj);
        }).map(function (line) {
            var newobj = {};
            Object.keys(line).forEach(function (key) {
                if (!query.update.$deleteKeys.includes(key)) {
                    newobj[key] = line[key];
                }
            });
            return newobj;
        });
        var $where = {};
        var $update = {};
        Object.keys(query.where).filter(function (key) { return !key.includes("$"); }).forEach(function (key) {
            $where[key] = query.where[key];
        });
        Object.keys(query.update).filter(function (key) { return !key.includes("$"); }).forEach(function (key) {
            $update[key] = query.update[key];
        });
        var n = __assign(__assign({}, $update), $where);
        console.log(newlines);
        hits = lines || [];
        updated = (newlines.length > 0) ? newlines : (query.update.$upsert ? [n] : []);
    });
    updatedWhole = data + ((updated.length > 0) ? "\n" : "") + updated.map(function (res) { return JSON.stringify(res); }).join("\n");
    return {
        found: hits,
        updated: Query.update ? updated : [],
        wholedata: updatedWhole.slice(updatedWhole.indexOf("{"), updatedWhole.length)
    };
};
exports.Query = Query;
var JhokeClient = /** @class */ (function () {
    function JhokeClient(uid, value, optional) {
        this.defaultUrl = (process.argv.includes("dev")) ? "http://localhost:3000" : "https://bucketstore.onrender.com";
        this.value = value;
        this.uid = uid;
        this.optional = optional;
    }
    JhokeClient.prototype.save = function (obj) {
        var _this = this;
        var val = (function () { return __awaiter(_this, void 0, void 0, function () {
            var currentsave, _a, uidURL, success, res, params, newsaveurl;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, axios_1["default"].post(this.defaultUrl + "/get", { key: this.uid })];
                    case 1:
                        _a = (_b.sent()).data, uidURL = _a.data, success = _a.success;
                        if (!!success) return [3 /*break*/, 2];
                        currentsave = {};
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, axios_1["default"].get(uidURL)];
                    case 3:
                        res = _b.sent();
                        currentsave = (JSON.parse(res.data.split("<div id=\"viewPost\">")[1].split("</div>")[0].trim()));
                        _b.label = 4;
                    case 4:
                        params = new URLSearchParams();
                        params.append("saveText", "Save Text!");
                        params.append("lines", JSON.stringify(__assign(__assign({}, currentsave), obj)));
                        return [4 /*yield*/, axios_1["default"].post("https://textsaver.flap.tv/index.php", params)
                                .then(function (res) { return res.data.split("id=\"listLink\">")[1].split("<")[0]; })];
                    case 5:
                        newsaveurl = _b.sent();
                        return [4 /*yield*/, axios_1["default"].post(this.defaultUrl + "/save", { key: this.uid, value: newsaveurl })];
                    case 6:
                        _b.sent();
                        return [2 /*return*/, newsaveurl];
                }
            });
        }); });
        return new JhokeClient(this.uid, val(), this.optional);
    };
    JhokeClient.prototype.saveObjToURL = function (obj) {
        var _this = this;
        var params = new URLSearchParams();
        params.append("lines", JSON.stringify(obj)),
            params.append("saveText", "Save Text!");
        return new JhokeClient(this.uid, (function () { return __awaiter(_this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1["default"].post("https://textsaver.flap.tv/index.php", params).then(function (res) { return res.data.split("id=\"listLink\">")[1].split("<")[0]; })];
                    case 1:
                        url = _a.sent();
                        return [2 /*return*/, url];
                }
            });
        }); })(), this.optional);
    };
    JhokeClient.prototype.get = function (key) {
        var _this = this;
        return new JhokeClient(this.uid, (function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, uidURL, error, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, axios_1["default"].post(this.defaultUrl + "/get", { key: this.uid })];
                    case 1:
                        _a = (_b.sent()).data, uidURL = _a.data, error = _a.error;
                        if (error) {
                            return [2 /*return*/, this.value || null];
                        }
                        return [4 /*yield*/, axios_1["default"].get(uidURL)];
                    case 2:
                        res = _b.sent();
                        return [2 /*return*/, (JSON.parse(res.data.split("<div id=\"viewPost\">")[1].split("</div>")[0].trim())[key])];
                }
            });
        }); })(), this.optional);
    };
    JhokeClient.prototype.getValueFromURL = function (key, url) {
        var _this = this;
        return new JhokeClient(this.uid, (function () { return __awaiter(_this, void 0, void 0, function () {
            var retrieveURL, _a, res, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = url;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.value];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        retrieveURL = _a;
                        if (typeof retrieveURL !== "string") {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, axios_1["default"].get(retrieveURL).then(function (res) { return res.data.split("<div id=\"viewPost\">")[1].split("</div>")[0].trim(); })];
                    case 3:
                        res = _b.sent();
                        response = key ? ((JSON.parse(res))[key]) : res;
                        return [2 /*return*/, response];
                }
            });
        }); })(), this.optional);
    };
    JhokeClient.prototype.pipe = function (func) {
        return new JhokeClient(this.uid, this.value.then(function (res) { return func(res); }), this.optional);
    };
    JhokeClient.prototype.query = function (q, perurl) {
        var _this = this;
        var val = (function () { return __awaiter(_this, void 0, void 0, function () {
            var data, data_1, params, url, retrieveURL, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        data = "";
                        if (!!perurl) return [3 /*break*/, 7];
                        return [4 /*yield*/, axios_1["default"].post(this.defaultUrl + "/get", {
                                key: this.uid
                            })];
                    case 1:
                        data_1 = (_a.sent()).data;
                        if (!!data_1.data) return [3 /*break*/, 2];
                        data_1 = "";
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, axios_1["default"].get(data_1.data).then(function (res) { return res.data.split("<div id=\"viewPost\">")[1].split("</div>")[0].trim().replace("<br />", ""); })];
                    case 3:
                        data_1 = _a.sent();
                        _a.label = 4;
                    case 4:
                        data_1 = Query(q, data_1);
                        params = new URLSearchParams();
                        params.append("saveText", "Save Text!");
                        params.append("lines", data_1.wholedata);
                        return [4 /*yield*/, axios_1["default"].post("https://textsaver.flap.tv/index.php", params).then(function (res) { return res.data.split("id=\"listLink\">")[1].split("<")[0]; })];
                    case 5:
                        url = _a.sent();
                        return [4 /*yield*/, axios_1["default"].post(this.defaultUrl + "/save", {
                                key: this.uid,
                                value: url
                            })];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, data_1];
                    case 7:
                        if (!perurl) return [3 /*break*/, 9];
                        retrieveURL = perurl;
                        return [4 /*yield*/, axios_1["default"].get(retrieveURL).then(function (res) { return res.data.split("<div id=\"viewPost\">")[1].split("</div>")[0].trim().split("<br />").join(""); })];
                    case 8:
                        res = _a.sent();
                        data = Query(q, res);
                        _a.label = 9;
                    case 9: return [2 /*return*/, data];
                }
            });
        }); });
        return new JhokeClient(this.uid, val(), this.optional);
    };
    return JhokeClient;
}());
exports.JhokeClient = JhokeClient;
