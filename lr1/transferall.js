"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
var web3_js_1 = require("@solana/web3.js");
var fs_1 = require("fs");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var connection, sender, recipient, balance, fee, amount, tx, sig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connection = new web3_js_1.Connection("http://127.0.0.1:8899", "confirmed");
                    sender = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs_1.default.readFileSync("second-wallet.json"))));
                    recipient = new web3_js_1.PublicKey("G5XhJ1BFYJmzjWuGvCWBDB8GsMeMyohn1Fom3RmhTLmx");
                    return [4 /*yield*/, connection.getBalance(sender.publicKey)];
                case 1:
                    balance = _a.sent();
                    fee = 5000;
                    amount = balance - fee;
                    tx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
                        fromPubkey: sender.publicKey,
                        toPubkey: recipient,
                        lamports: amount,
                    }));
                    return [4 /*yield*/, connection.sendTransaction(tx, [sender])];
                case 2:
                    sig = _a.sent();
                    return [4 /*yield*/, connection.confirmTransaction(sig)];
                case 3:
                    _a.sent();
                    console.log("\u041F\u0435\u0440\u0435\u0432\u0435\u0434\u0435\u043D\u043E ".concat(amount / 1e9, " SOL (\u0432\u0441\u0451, \u043A\u0440\u043E\u043C\u0435 \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u0438)"));
                    return [2 /*return*/];
            }
        });
    });
}
