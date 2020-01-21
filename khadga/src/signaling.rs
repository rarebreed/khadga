//! Code for getting the signaling server to work.  The signaling server acts as a rendezvous point
//! and relay for 2 remote systems to discover each other and communicate peer to peer.  This is
//! needed due to some systems possibly being behind a NAT or other firewall.  For now, we will not
//! implement a TURN server, and only implement STUN.  This means that the remote systems must allow
//! a remote system to connect to it, even if it has not connected with the other remote system first.

pub struct ChatWS {}
