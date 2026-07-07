import socket

try:
    addrinfo = socket.getaddrinfo("127.0.0.1", None)
    print(addrinfo)
    import ipaddress
    for info in addrinfo:
        ip = ipaddress.ip_address(info[4][0])
        print(ip.is_private, ip.is_loopback)
except Exception as e:
    print(e)
