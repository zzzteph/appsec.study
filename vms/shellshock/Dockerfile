# ---- build a genuinely vulnerable bash 4.3 (pre-CVE-2014-6271 patch) ----
FROM debian:bookworm AS bashbuild
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential curl ca-certificates bison \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /src
RUN curl -fsSL -o bash.tar.gz https://ftp.gnu.org/gnu/bash/bash-4.3.tar.gz \
 && tar xzf bash.tar.gz
WORKDIR /src/bash-4.3
RUN ./configure --without-bash-malloc >/dev/null && make -j"$(nproc)" >/dev/null \
 && cp bash /usr/local/bin/bash43 && strip /usr/local/bin/bash43

# ---- runtime: Apache + mod_cgi using the vulnerable bash ----
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      apache2 libtinfo6 procps net-tools iputils-ping \
 && rm -rf /var/lib/apt/lists/*
COPY --from=bashbuild /usr/local/bin/bash43 /usr/local/bin/bash43
RUN a2enmod cgid >/dev/null
COPY web/ /var/www/html/
COPY cgi-bin/ /usr/lib/cgi-bin/
RUN sed -i 's/\r$//' /usr/lib/cgi-bin/*.cgi && chmod +x /usr/lib/cgi-bin/*.cgi
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
