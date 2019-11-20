# Fixing The Capital One Breach

[I previously wrote](https://ejj.io/blog/capital-one) about the technical details of the Capital One breach.

I called for improvements to the metadata service. So did Senator Warren and Senator Wyden in their [letter to the FTC](https://www.wyden.senate.gov/download/102419-wyden-warren-letter-to-ftc-re-amazon-capital-one-hack)! Amazon responded today with some changes to the EC2 instance metadata service in direct response to the Capital One breach.

# Session Based Metadata

Amazon rolled out a change that they describe as using ["session-based requests"](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html) in order to mitigate the risk of SSRF in the EC2 metadata service. They refer to the new offering as **IMDSv2**, with the previous offering used by Capital One being IMDSv1.

The IMDSv1 flow to retrieve a temporary credential looked like this

<img src="https://i.imgur.com/GiQ4jNj.jpg">

With IMDSv2, clients must first create a session before retrieving credentials from the metadata service. Clients do this by retrieving a 'session token' that is valid for a configurable amount of time.

<img src="https://i.imgur.com/ba8SMZA.jpg">

You'll notice that everything is mostly the same, with an extra round trip to retrieve a session token from the metadata service.

```
$ curl -sX PUT "http://169.254.169.254/latest/api/token" \
       -H "X-aws-ec2-metadata-token-ttl-seconds: 1"
```

Above, we create a new session token that is valid for 1 second. Sessions are created with a simple HTTP `PUT` request to the metadata service.

It returns a base64 encoded token with the effective security of 44 bytes, which is cryptographically secure from brute force. The leading 4 bytes of the 48 byte sequence is standard across all session tokens and is just a prefix.

```
$ curl -sX PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 1" | base64 -d | xxd

00000000: 0100 0000 1139 a664 12bc b9b2 7263 dad4  .....9.d....rc..
00000010: cb2a 08b1 774c 9bcb 99c8 47bc 3498 5dc2  .*..wL....G.4.].
00000020: 075b d789 6d20 22e2                      .[..m ".
```

# What does IMDSv2 protect against?
Creating a session token requires the ability to make a `PUT` request. Many SSRF attacks use the HTTP `GET` method. Requiring HTTP `PUT` prevents `GET` based attacks (like webhooks) but this is not a complete solution to SSRF problems.

Notice, this request fails to return credentials. The metadata service returns a `405 Method Not Allowed` response when using the `GET` method to retrieve a session token with IMDSv2.

```
$ curl -s "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 1" -v

*   Trying 169.254.169.254...
* TCP_NODELAY set
* Connected to 169.254.169.254 (169.254.169.254) port 80 (#0)
> GET /latest/api/token HTTP/1.1
> Host: 169.254.169.254
> User-Agent: curl/7.58.0
> Accept: */*
> X-aws-ec2-metadata-token-ttl-seconds: 1
> 
* HTTP 1.0, assume close after body
< HTTP/1.0 405 Method Not Allowed
< Allow: OPTIONS, PUT
< Content-Length: 0
< Content-Type: text/plain
< Date: Wed, 20 Nov 2019 04:11:08 GMT
< Connection: close
< Server: EC2ws
< 
* Closing connection 0
```

# What are the issues with this?
## It does not protect reverse proxies and web application firewalls
This defense mechanism relies on `PUT` requests being hard for an attacker to forge. In many cases this is true, but in the example of a reverse proxy or firewall it is not difficult to forge.

Amazon's blog post announcing this feature says it is defense in depth for [reverse proxies and firewalls](https://aws.amazon.com/blogs/security/defense-in-depth-open-firewalls-reverse-proxies-ssrf-vulnerabilities-ec2-instance-metadata-service/) specifically. This is not correct in the case where a reverse proxy or firewall proxies all HTTP methods (like `PUT`). L7 Firewalls (like a WAF) and reverse proxies are actually the same thing, except WAFs have additional logic to block requests.

Reverse proxies and firewalls alike are meant to forward all requests, `PUT`, `GET`, `PATCH`, or `DELETE` without discrimination, so a misconfigured WAF or reverse proxy could still retrieve instance credentials from the metadata service.

The same misconfigurations of your reverse proxies and WAFs will result in the same compromise with _IMDSv2_ as _IMDSv1_.

## Opt in, i.e. Not Amazon's Problem
Amazon cannot break compatibility with version 1 of the metadata service. They have provided a new feature for their security conscious customers. Enforcing that all requests to the metadata service _must_ use session-based requests is manual for customers.

In order to enforce an EC2 instance use the more secure metadata service, AWS customers must configure each EC2 instance in their fleet using the optional [MetadataOptions](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_InstanceMetadataOptionsRequest.html) API argument.

For their security conscious customers, AWS has done the hard work to help customers find issues in their infrastructure by logging `MetadataNoToken` to CloudWatch for all usage of the old metadata service. However, using the new metadata service requires manually updating AWS client libraries.  

# Takeaways
Amazon has improved the metadata service but the technical merits of the change are underwhelming. 

Two specific ideas come to mind that are stronger protection from SSRF attacks. First is a filesystem based approach where credentials can be read from the filesystem. Second is two-factor roles using the externalID, [borrowing from the confused deputy problem protection](https://aws.amazon.com/blogs/security/how-to-use-external-id-when-granting-access-to-your-aws-resources/) (which was outlined in my previous blog post).

Both would be stronger protections to this problem.

This fix mostly allows AWS to respond to criticism in the wake of the Capital One breach, but it's questionable how much this really protects customers. Implementing this change in a large organization would still require a lot of work from customers, enforcing usage of the new service is opt in, and the protection achieved is not nearly comprehensive.

# How does this compare with GCP and Azure?
When comparing the protections of IMDSv2 in AWS with the metadata service protections in GCP and Azure, AWS's offering is unique. IMDSv2 protects against some attacks that GCP and Azure do not by requiring control of the HTTP method. 

GCP and Azure have different protections that require attackers to have control over the HTTP headers forwarded to the metadata service.

AWS has improved their offering, but it might not be as comprehensive as their blog post is advertising, and it comes with quite a lot of complexity.

At this point, it is fair to say that AWS' IMDSv2 offering is equal in security to the offering provided by GCP and Azure, but I hope to see _IMDSv3_ in the future to improve AWS security further.