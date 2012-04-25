/* mysql
 * This module provides MySQL connection management for Argent.
 */

mods.mysql = {
    init:function(){return 0;},
    receiveRequest(r, u, q){return true;},
    shutdown(){}
};
