# Preventing The Capital One Breach

We have more information in the Capital One breach than most other major breaches, thanks to the online activity of accused hacker Paige Thompson. You can read about that via [Kreb's article](https://krebsonsecurity.com/tag/paige-a-thompson/).

Every indication is that the attacker exploited a type of vulnerability known as Server Side Request Forgery (SSRF) in order to perform the attack. SSRF has become the most serious vulnerability facing organizations that use public clouds. SSRF is not an unknown vulnerability, but it doesn't receive enough attention and was absent from the [OWASP Top 10](https://www.owasp.org/images/7/72/OWASP_Top_10-2017_%28en%29.pdf.pdf). 

SSRF is a bug hunters dream because it is an easy to perform attack and regularly yields critical findings, like this [bug bounty report to Shopify](https://hackerone.com/reports/341876). The problem is common and well-known, but hard to prevent and does not have any mitigations built in to the AWS platform.

<img src="https://i.imgur.com/cJA40KM.jpg"/>

Server Side Request Forgery is an attack where a server can be tricked into connecting to a server it did not intend. SSRF is more deeply explained in this [article by Hackerone](https://www.hackerone.com/blog-How-To-Server-Side-Request-Forgery-SSRF). The impact of SSRF is being worsened by the offering of public clouds, and the major players like AWS are not doing anything to fix it.

# What is the metadata service?

Understanding why SSRF is such a critical bug first requires an understanding of how a "Role" in AWS works.

The EC2 instances within AWS by default are not on dedicated hardware for only your business. This is not a bad thing for security because each company's workload is isolated inside of a virtual machine (out of scope in this conversation is [spectre and meltdown type of attacks](https://meltdownattack.com/)). Each of these virtual machines has a different IAM Role, which describes policies and permissions that are assigned to each workload.

You'll see in this example we have a customer who has given their EC2 instance an "Admin" role, a "ReadOnly" role, and lastly a "Billing" role.

<img src="https://i.imgur.com/FEPUqdV.jpg"/>

When Customer 1 wants to upload an image to AWS S3 , the client libraries that AWS has built will automatically fetch fresh IAM Role credentials from the metadata service. Without going into too much detail, the flow looks something like this:

<img src="https://i.imgur.com/4rkcFxD.jpg"/>

What is interesting about this is the metadata service runs on the hypervisor and coordinates retrieving fresh credentials before they expire. When making a request to the magic IP address where customers can reach the metadata service, the request will never leaves the machine and never goes over the network. This is the reason why the metadata service doesn't support HTTPS.

In practice, the above example of making a request to AWS S3 looks more like the below image, where each EC2 instance trusts the hypervisor host it is running on. This is the mechanism that AWS uses to bootstrap trust automatically. AWS assumes customers trust the hypervisor because that trust assumption is inherent in a customer signing up and using AWS.

<img src="https://i.imgur.com/UsCLRL2.jpg"/>

The metadata service is an amazing innovation. It provided customers with a mechanism to write software that securely authenticates with AWS services without requiring any special code or handling of real IAM keys (which have been the source of many other breaches).

# What are the drawbacks to the metadata service?

The metadata service provides temporary credentials that services can pull out of thin air which is an improvement over managing credentials that never expire. However, with improved usability some gotchas exist.

### Accessing the credentials is easy!

It's extremely easy to access the IAM Role temporary credentials that are provided by the metadata service. This is an example of how easy it is access the metadata service. There is no authentication and no authorization to access the service. Using curl, it's pretty easy to explore the static files that are available within your metadata service.

<img src="https://i.imgur.com/b0pe7Ki.jpg"/>

All processes can talk to the metadata service service and access temporary credentials with any out of the box operating system.

## All HTTP Requests are trusted

It's more common for SaaS companies to make HTTP requests for their customers than it is to run arbitrary code for their customers. Stripe, Segment, Github, Slack, and just about every major SaaS company offers some form of Webhook product. Service providers will make HTTP requests on a customer's behalf to a URL the customer specifies. Preventing DNS rebinding and validating these URLs [is not easy at all](https://youtu.be/fK_68n92t3g).

It is a dangerous assumption to offer only an HTTP based metadata service because the world has shifted where most services are communicating via HTTP. My rule of thumb is that anywhere a hostname or IP address is accepted as user-input there is a 50% chance that SSRF is possible, and an attacker could potentially make requests to the metadata service.

# What can AWS do to fix this?

In my opinion, it's clear that AWS' product offering is not complete since this is a major and recurring problem amongst their biggest customers. AWS should do something about this because IAM is the root of all security within AWS.

## Require a special header for metadata service requests.

AWS could enforce a specific header is required in order to communicate with the metadata service. [Google Cloud Platform offers this as a feature of their IAM Roles](https://cloud.google.com/compute/docs/storing-retrieving-metadata#querying).
```
    curl "http://metadata.google..." -H "Metadata-Flavor: Google"
    ```
    This is a mitigation in cases where an attacker does not control the entire HTTP request that is being crafted as part of the SSRF attack. It won't fix all SSRF attacks but it is an improvement an provides protections for simple webhooks implementations where customers can provide only a URL that receives requests. 

    ## "Two Factor" Credentials

    Temporary credentials could require a second factor of authentication. It might seem like this defeats the purpose of being able to pull credentials out of thin-air, but if IAM Roles required a second cryptographically difficult to guess string then it allows for two things:

    First, attackers who can access the metadata service but can't read the second factor from disk or source code are not able to use the credentials they retrieve from a successful SSRF attack.

    Second, employees who are handling this second factor string do not need to take too many precautions to protect it. They can treat it like a secret, but by itself it is not sensitive so fewer precautions would need to be taken when handling the second factor. 

    AWS could offer this simply [making use of the External ID used to mitigate against the confused deputy problem](https://aws.amazon.com/blogs/security/how-to-use-external-id-when-granting-access-to-your-aws-resources/).

    ```
        {
              "Version": "2012-10-17",
                    "Statement": {
                            "Effect": "Allow",
                                    "Principal": {"AWS": "Example Corp's AWS Account ID"},
                                            "Action": "sts:AssumeRole",
                                                    "Condition": {"StringEquals": {"sts:ExternalId": "d35813840e191d93812071cf3cbce3f8"}}
                                                          }
                                                              }
                                                              ```
                                                              Here is an example of an IAM role's trust policy with a securely set ExternalID. If AWS required an external ID to be submitted with temporary credentials instead of during an assume-role API call then the credentials from a successful SSRF attack would be useless.

                                                              ## Require Temporary Credentials to be used in the correct VPC

                                                              Today, many people are surprised to learn that temporary credentials can be used from other AWS customer's Virtual Private Cloud, and even from your home laptop. Being able to require that temporary IAM credentials are being used from within the correct VPC would require a full remote code execution attack where an attacker can run code within the victim's infrastructure.

                                                              Determining when a credential has been compromised and is being used in the wrong VPC would require a lot of work from AWS. However, this is something that power users of AWS have started to figure out how to detect, and the [folks at Netflix have published some amazing research on the topic](https://medium.com/netflix-techblog/netflix-cloud-security-detecting-credential-compromise-in-aws-9493d6fd373a).
