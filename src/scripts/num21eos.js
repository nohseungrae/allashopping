document.addEventListener('scatterLoaded', scatterExtension => {
    console.log('#scatterExtension loaded');
    if(num21eos.sco === undefined || num21eos.sco === null) {
        num21eos.sco = window.scatter;

        num21eos.isScExtLoaded = true;
        if(num21eos.isTryConnectOnLoad === true && num21eos.isConnected === false) {
            num21eos.connectScExt();
        }
    }
    num21eos.isScExtLoaded = true;
});

var num21eos = {
    appName: '7Chain',
    chainId: null,
    network: null,
    isEnableEosLog: true,
    isShowErrorPopup: true,
    isPrintConsole: false,
    isConnected: false,
    isInitError: false,
    isScExtLoaded: false,
    tokenType: 'EOS',
    issuer: 'eosio.token',
    callbackInitSuccess: null,
    callbackInitError: null,
    sco: null,
    scatterType: null,
    isCheckingIdentityRunning: false,
    isTryConnectOnLoad: false,
    tryConnectIntervalId: null,
    messageDef: {
        CONNECT_FAILED: 'connect failed',
        SCATTER_NOT_LOADED: 'scatter not loaded'
    },
    init: function (appName, network, isShowErrorPopup, isTryConnectOnLoad, c_success, c_error) {
        let that = this;
        that.callbackInitSuccess = c_success;
        that.callbackInitError = c_error;
        if (appName === null || appName === undefined)
            console.warn('appName is not defined');
        else that.appName = appName;
        that.chainId = network.chainId;
        that.network = network;
        that.isShowErrorPopup = isShowErrorPopup;
        that.isTryConnectOnLoad = isTryConnectOnLoad;

        if (isTryConnectOnLoad === true) {
            that.connectScatter(c_success, c_error);
        }
        that.eosNetwork = {
            chainId: network.chainId,
            httpEndpoint: network.protocol + "://" + network.host + ":" + network.port,
            broadcast: true,
            keyProvider: ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'],
            verbose: false,
            logger: {
                log: that.isEnableEosLog? console.log: null,
                error: console.error
            },
            sign: true
        };
    },
    connectScatter: function (c_success, c_error) {
        let that = this;
        if(krjsUtil.checkDeviceTypeMobile() === true) {
            that.connectScExt(c_success, c_error);
        }
        else {
            if (that.isScExtLoaded === true) that.connectScExt(c_success, c_error);
            else that.connectScDsk(c_success, c_error);
        }
    },
    connectScDsk: function (c_success, c_error) {
        console.log('#connectScDsk');
        let that = this;
        that.scatterType = 'desktop';
        try {
            ScatterJS.plugins(new ScatterEOS());
            ScatterJS.scatter.connect(that.appName, that.network).then(connected => {
                if (!connected) {
                    let msg = 'scatter desktop is not loaded';
                    num21eos.showErrorPopup(msg);
                    if (c_error) c_error(msg);
                    else if(that.callbackInitError) that.callbackInitError(msg);
                    return false;
                }

                that.sco = ScatterJS.scatter;

                //that.requestIdentity(c_success, c_error);
                that.isInitError = false;

                if(that.scatterType === 'desktop')
                    that.checkIdentityForDesktop();
            }).catch(error => { console.log(error); });
        }
        catch (e) {
            console.log('#connectScDsk error');
            console.log(e);
        }
    },
    checkIdentityForDesktop: function() {
        if(num21eos.isCheckingIdentityRunning === false) {
            num21eos.isCheckingIdentityRunning = true;
            if(num21eos.scatterType === 'desktop') {
                num21eos.tryConnectIntervalId = setInterval(function () {                    
                    if(num21eos.isConnected === false && num21eos.isInitError === false) {
                        num21eos.requestIdentity();
                    }
                }, 1000);
            }
        }
    },
    clearTryConnectInterval: function() {
        if(num21eos.tryConnectIntervalId !== null) {
            clearInterval(num21eos.tryConnectIntervalId);
            num21eos.tryConnectIntervalId = null;
        }
    },
    requestIdentity: function(c_success, c_error) {
        console.log('#requestIdentity');
        let that = this;
        if(that.sco === undefined || that.sco === null) {
            console.log('scatter not initialized yet');
        }
        else {
            that.sco.getIdentity({accounts: [that.network]}).then(identity => {
                that.account = identity.accounts.find(account => account.blockchain === that.network.blockchain);
                that.eso = that.sco.eos(that.network, Eos, that.eosNetwork);
                that.isConnected = true;

                window.ScatterJS = null;
                window.scatter = null;

                that.clearTryConnectInterval();

                if (c_success) c_success();
                else if(that.callbackInitSuccess) that.callbackInitSuccess();
            }, function (error) {
                that.isConnected = false;
                that.isInitError = true;
                let msg = 'getIdentity failed';
                if (error) {
                    if (error.message) {
                        num21eos.showErrorPopup(error.message);
                        msg = error.message;
                    }
                }
                if (c_error) c_error(msg);
                else if(that.callbackInitError) that.callbackInitError(msg);
            }).catch(error => { console.log(error); });
        }
    },
    connectScExt: function (c_success, c_error) {
        let that = this;
        that.scatterType = 'extension';
        console.log('#connectScExt');
        that.requestIdentity(c_success, c_error);
    },
    onResult: function(that, callback, result, memo, isSuccess, isWrapped) {
        if(isWrapped === true) {
            let response = {
                isSuccess: isSuccess,
                data: result,
            };
            if(that.isPrintConsole === true){
                if(isSuccess === true) console.log(response);
                else console.error(response);
            }
            if(callback) callback(response);
        }
        else {
            if(that.isPrintConsole === true){
                if(isSuccess === true) console.log(result);
                else console.error(result);
            }
            if(callback) callback(result);
        }
    },
    getInfo: function (c_success, c_error, isWrapped) {
        let that = this;
        if (that.eso) {
            that.eso.getInfo({})
                .then(result => { that.onResult(that, c_success, result, '', true, isWrapped);
                }, function (error) { that.onResult(that, c_error, error, 'get info failed', false, isWrapped); });
        }
        else { that.onResult(that, c_error, null, that.messageDef.SCATTER_NOT_LOADED, false, isWrapped); }
    },
    getAccount: function (accountName, c_success, c_error, isWrapped) {
        let that = this;
        if (that.eso) {
            that.eso.getAccount({account_name: accountName})
                .then(result => { that.onResult(that, c_success, result, '', true, isWrapped); })
                .catch(error => { that.onResult(that, c_error, error, 'get account failed', false, isWrapped); });
        }
        else { that.onResult(that, c_error, null, that.messageDef.SCATTER_NOT_LOADED, false, isWrapped); }
    },
    forgetIdentity: function (c_success, c_error, isWrapped) {
        let that = this;
        that.isConnected = false;
        try {
            if (that.sco) {
                that.sco.forgetIdentity()
                    .then(result => { that.onResult(that, c_success, result, '', true, isWrapped); })
                    .catch(error => { that.onResult(that, c_error, error, 'forgetIdentity failed', false, isWrapped); });
            }
        }
        catch (e) {
            that.onResult(that, c_error, e, 'forgetIdentity failed', false, isWrapped);
        }
    },
    getCurrencyBalance: async function (c_success, c_error, isWrapped) {
        let that = this;
        console.log(that.eso);
        if (that.eso) {
            let sendObj = {
                code: that.issuer,
                account: that.account.name,
                symbol: that.tokenType
            };
            that.eso.getCurrencyBalance(sendObj)
                .then(result => { that.onResult(that, c_success, result, '', true, isWrapped); })
                .catch(error => { that.onResult(that, c_error, error, 'getCurrencyBalance failed', false, isWrapped);
                });
        }
        else { that.onResult(that, c_error, null, that.messageDef.SCATTER_NOT_LOADED, false, isWrapped); }
    },
    getCurrencyStats: function (c_success, c_error, isWrapped) {
        let that = this;
        if (that.eso) {
            let sendObj = {
                code: that.issuer,
                account: that.account.name,
                symbol: that.tokenType
            };
            that.eso.getCurrencyStats(sendObj)
                .then(result => { that.onResult(that, c_success, result, '', true, isWrapped); })
                .catch(error => { that.onResult(that, c_error, error, 'getCurrencyStats failed', false, isWrapped); });
        }
        else { that.onResult(that, c_error, null, that.messageDef.SCATTER_NOT_LOADED, false, isWrapped); }
    },
    getTableRows: function(contractName, tableName, c_success, c_error, isWrapped) {
        let that = this;
        if (that.eso) {
            let sendObj = {
                code: contractName,
                scope: contractName,
                table: tableName,
                json: true
            };
            that.eso.getTableRows(sendObj)
                .then(result => { that.onResult(that, c_success, result, '', true, isWrapped); })
                .catch(error => { that.onResult(that, c_error, error, 'getTableRows failed', false, isWrapped);
                });
        }
        else { that.onResult(that, c_error, null, that.messageDef.SCATTER_NOT_LOADED, false, isWrapped); }
    },
    getTableRowsByUser: function(contractName, tableName, userName, c_success, c_error, isWrapped) {
        let that = this;
        if (that.eso) {
            let sendObj = {
                code: contractName,
                scope: contractName,
                table: tableName,
                lower_bound: userName,
                upper_bound: userName,
                index_position: 1,
                json: true
            };
            that.eso.getTableRows(sendObj)
                .then(result => { that.onResult(that, c_success, result, '', true, isWrapped); })
                .catch(error => { that.onResult(that, c_error, error, 'getTableRows failed', false, isWrapped);
                });
        }
        else { that.onResult(that, c_error, null, that.messageDef.SCATTER_NOT_LOADED, false, isWrapped); }
    },
    getActions: function(contractName, c_success, c_error, isWrapped) {
        let that = this;
        if (that.eso) {
            that.eso.getActions(contractName, -1)
                .then(result => { that.onResult(that, c_success, result, '', true, isWrapped); })
                .catch(error => { that.onResult(that, c_error, error, 'getActions failed', false, isWrapped);
                });
        }
        else { that.onResult(that, c_error, null, that.messageDef.SCATTER_NOT_LOADED, false, isWrapped); }
    },
    getBlock: function(blockNum, c_success, c_error, isWrapped) {
        let that = this;
        if (that.eso) {
            that.eso.getBlock(blockNum)
                .then(result => { that.onResult(that, c_success, result, '', true, isWrapped); })
                .catch(error => { that.onResult(that, c_error, error, 'getBlock failed', false, isWrapped);
                });
        }
        else { that.onResult(that, c_error, null, that.messageDef.SCATTER_NOT_LOADED, false, isWrapped); }
    },
    getTransaction: function(id, blockNum, c_success, c_error, isWrapped) {
        let that = this;
        if (that.eso) {
            that.eso.getTransaction(id, blockNum)
                .then(result => { that.onResult(that, c_success, result, '', true, isWrapped); })
                .catch(error => { that.onResult(that, c_error, error, 'getTransaction failed', false, isWrapped);
                });
        }
        else { that.onResult(that, c_error, null, that.messageDef.SCATTER_NOT_LOADED, false, isWrapped); }
    },
    requestArbitrarySignature: async function(baseString) {
        let that = this;
        that.beforeArbitrarySignature = baseString;
        let publicKey = that.sco.identity.publicKey;
        console.log(that.sco.identity.publicKey);
        let result = null;
        await that.sco.getArbitrarySignature(publicKey, baseString).then(signature => {
            console.log(signature);
            that.computedArbitrarySignature = signature;
            result = signature;
        }).catch(error => {
            console.log('#error : arbitrarySignature failed');
            console.log(error);
        });
        return result;
    },
    requestArbitrarySignatureForTicket: async function(gameId, ticketId) {
        let that = this;
        let publicKey = that.sco.identity.publicKey;
        let response = null;
        await that.sco.getArbitrarySignature(publicKey, ticketId).then(signature => {
            response = {
                userId: that.account.name,
                requestData: gameId,
                ticketId: ticketId,
                publicKey: publicKey,
                sig: signature
            };
        }).catch(error => {
            console.log('#error : arbitrarySignature failed');
            console.log(error);
        });
        return response;
    },
    testPush: function() {
        let sendObj = {
            actions : [ {
                account : 'batwallet123',
                name : 'withdraw',
                data : {
                    user:'kiru123kiru1',
                    quantity: '0.1000 EOS',
                },
                authorization : [ {
                    actor : 'kiru123kiru1',
                    permission : 'active'
                } ]
            } ]
        };
        num21eos.eso.transaction(sendObj)
            .then(result => { console.log('success'); console.log(result); })
            .catch(error => { console.log('error'); console.log(error);
            });
    },
    sendCommonWithdraw: async function(walletAccount, quantity) {
        let response = {
            isSuccess: false,
            data: null,
            message: null,
            isUserCancel: false
        };
        let that = this;
        let sendObj = {
            actions : [ {
                account : walletAccount,
                name : 'withdraw',
                data : {
                    user: that.account.name,
                    quantity: quantity,
                },
                authorization : [ {
                    actor : that.account.name,
                    permission : that.account.authority
                } ]
            } ]
        };
        try {
            let result = await num21eos.eso.transaction(sendObj);
            response.isSuccess = true;
            response.data = result;
        } catch (err) {
            num21eos.onTransactionError(response, err);
        }
        return response;
    },
    transfer: async function (sendObj) {
        let response = {
            isSuccess: false,
            data: null,
            message: null,
            isUserCancel: false
        };
        try {
            let result = await num21eos.eso.transaction(sendObj);
            response.isSuccess = true;
            response.data = result;
        } catch (err) {
            num21eos.onTransactionError(response, err);
        }
        return response;
    },
    onTransactionError: function(response, err) {
        try {
            if (typeof err === 'string') {
                err = JSON.parse(err);
            }
        }
        catch (e) {
            console.log(e);
        }
        let isFound = false;
        let checkedMessage = '';
        if (err.message) {
            if(err.message.toLowerCase().includes('user rejected the signature')) {
                response.isUserCancel = true;
                isFound = true;
                checkedMessage = g_lang_table.TEXT_USER_REJECTED_REQUEST;
            }
            else checkedMessage = err.message;
        }
        if(isFound === false) {
            if (err.error && err.error.details) {
                err.error.details.forEach(function (detail) {
                    if(detail.message) {
                        let lowerCased = detail.message.toLowerCase();
                        if(lowerCased.includes('maintenance')) {
                            isFound = true;
                            checkedMessage = g_lang_table.TEXT_ON_MAINTENANCE;
                        }
                        else if(lowerCased.includes('invalid sicbo type')) {
                            isFound = true;
                            checkedMessage = g_lang_table.TEXT_INVALID_PLACE;
                        }
                        else if(lowerCased.includes('invalid current game id')||lowerCased.includes('invalid game id')||lowerCased.includes('invalid betting time')||lowerCased.includes('invalid state')) {
                            isFound = true;
                            checkedMessage = g_lang_table.TEXT_INVALID_BETTING_TIME;
                        }
                        else if(lowerCased.includes('exceed maximum bet') || lowerCased.includes('bet is over')) {
                            isFound = true;
                            checkedMessage = g_lang_table.TEXT_MAX_BET_EXCEEDED;
                        }
                        else if(lowerCased.includes('is greater than the maximum billable CPU')) {
                            isFound = true;
                            checkedMessage = g_lang_table.TEXT_OUT_OF_CPU;
                        }
                        else if(lowerCased.includes('transaction net usage is too high')) {
                            isFound = true;
                            checkedMessage = g_lang_table.TEXT_OUT_OF_NET;
                        }
                    }
                });
            }
        }
        if(isFound === false) {
            console.error('#cannot find checked error message');
            console.error(err);
        }
        response.message = checkedMessage;
        num21eos.showErrorPopup(checkedMessage);
    },
    baccaratTransfer: async function(quantity, r, memoArr) {
        let that = this;
        let i;
        let sendObj = {
            actions : []
        };
        for(i=0;i<memoArr.length; i++) {
            sendObj.actions = [
                {
                    account : that.baccaratContractAccount,
                    name : 'activebet',
                    data : {
                        game_id: r,
                        user_bet_info: {
                            from: that.account.name,
                            user: that.account.name,
                            bet_amount: quantity.toFixed(4) + ' ' + that.tokenType,
                            bet_infos: memoArr
                        }
                    },
                    authorization : [ {
                        actor : that.account.name,
                        permission : that.account.authority
                    }]
                },
                {
                    account : 'eosio.token',
                    name : 'transfer',
                    data : {
                        from: that.account.name,
                        to: that.baccaratContractAccount,
                        quantity: quantity.toFixed(4) + ' ' + that.tokenType,
                        memo: ''
                    },
                    authorization : [ {
                        actor : that.account.name,
                        permission : that.account.authority
                    }]
                }
            ];
        }
        return await that.transfer(sendObj);
    },
    sicboTransfer: async function(quantity, r, memoArr) {
        let that = this;
        let i;
        let sendObj = {
            actions : []
        };
        for(i=0;i<memoArr.length; i++) {
            sendObj.actions = [
                {
                    account : that.sicboContractAccount,
                    name : 'activebet',
                    data : {
                        game_id: r,
                        user_bet_info: {
                            from: that.account.name,
                            user: that.account.name,
                            bet_amount: quantity.toFixed(4) + ' ' + that.tokenType,
                            bet_infos: memoArr
                        }
                    },
                    authorization : [ {
                        actor : that.account.name,
                        permission : that.account.authority
                    }]
                },
                {
                    account : 'eosio.token',
                    name : 'transfer',
                    data : {
                        from: that.account.name,
                        to: that.sicboContractAccount,
                        quantity: quantity.toFixed(4) + ' ' + that.tokenType,
                        memo: ''
                    },
                    authorization : [ {
                        actor : that.account.name,
                        permission : that.account.authority
                    }]
                }
            ];
        }
        return await that.transfer(sendObj);
    },
    diceTransfer: async function(amount, num, seedArray) {
        let that = this;
        let sendObj = {
            actions : [ {
                account : that.diceContractAccount,
                name : 'regbet',
                data : {
                    from: that.account.name,
                    user: that.account.name,
                    game_type: 0,
                    roll_dice_num: num,
                    bet_amount: amount + ' ' + that.tokenType,
                    seeds: seedArray
                },
                authorization : [ {
                    actor : that.account.name,
                    permission : that.account.authority
                } ]
            },
                {
                    account : 'eosio.token',
                    name : 'transfer',
                    data : {
                        from: that.account.name,
                        to: that.diceContractAccount,
                        quantity: amount + ' ' + that.tokenType,
                        memo: ''
                    },
                    authorization : [ {
                        actor : that.account.name,
                        permission : that.account.authority
                    } ]
                }
            ]
        };
        let response = await that.transfer(sendObj);
        return await that.parseDice(response);
    },
    walletTransfer: async function(walletAccount, quantity) {
        if(numphaser) {
            let that = this;
            let myAccount = that.account.name;
            let memo = "-1,0," + myAccount;

            let sendObj = {
                actions : [ {
                    account : 'eosio.token',
                    name : 'transfer',
                    data : {
                        from: myAccount,
                        to: walletAccount,
                        quantity: quantity,
                        memo: memo
                    },
                    authorization : [ {
                        actor : that.account.name,
                        permission : that.account.authority
                    } ]
                } ]
            };
            return await that.transfer(sendObj);
        }
    },
    parseDice: async function (response) {
        let result = {
            isSuccess: false,
            isUserCancel: response.isUserCancel,
            data: null,
            message: response.message
        };
        try{
            if(response.isSuccess === true) {
                result.isSuccess = true;
                // response.data.processed.action_traces.forEach(function (action_trace) {
                //     action_trace.inline_traces.forEach(function (inline_trace_lv1) {
                //         if(inline_trace_lv1.act.name === 'generateseed') {
                //             inline_trace_lv1.inline_traces.forEach(function (inline_trace_lv2) {
                //                 if(inline_trace_lv2.act.name === 'resultseed') {
                //                     inline_trace_lv2.inline_traces.forEach(function (inline_trace_lv3) {
                //                         if(inline_trace_lv3.act.name === 'dicereceipt') {
                //                             let data = inline_trace_lv3.act.data.game;
                //                             if(data) {
                //                                 result.isSuccess = true;
                //                                 result.data = data;
                //                             }
                //                         }
                //                     })
                //                 }
                //             })
                //         }
                //     })
                // })
            }
            if(result.isUserCancel === true) {
            }
            else if(result.message != null) {
                console.log(result.message);
                console.log(response);
            }
            else if(result.isSuccess === false) {
                console.log('cannot find game result');
                console.log(response);
            }
        }catch (e) {
            console.log(e);
            console.log(response);
        }
        return result;
    },
    showErrorPopup: function (msg) {
        if (num21eos.isShowErrorPopup === true) {
            swal(msg);
        }
    }
};
