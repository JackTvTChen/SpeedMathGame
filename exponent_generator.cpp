/*  exponent_generator.cpp  ─────────  10 000 rational-exponent questions
    compile:  g++ -std=c++20 -O2 exponent_generator.cpp -o expo_gen     */

    #include <iostream>
    #include <iomanip>
    #include <string>
    #include <vector>
    #include <array>
    #include <unordered_set>
    #include <random>
    #include <utility>
    #include <numeric>      // std::gcd
    #include <cmath>
    #include <cstdint>
    
    #if __cplusplus < 201703L
    // ---------------------------------------------------------------------------
    // Fallback gcd/lcm for pre-C++17 compilers (put inside std namespace to mimic
    // the real symbols so existing code remains unchanged).
    // ---------------------------------------------------------------------------
    namespace std {
        template <typename T>
        constexpr T gcd(T a, T b) {
            while (b != 0) {
                T t = a % b;
                a = b;
                b = t;
            }
            return a < 0 ? -a : a;   // always non-negative
        }
        template <typename T>
        constexpr T lcm(T a, T b) {
            return (a / gcd(a, b)) * b;
        }
    } // namespace std
    #endif
    
    /*───────────────────────────────────────────────────────────────────*/
    /*  0.  original +-×÷ difficulty helpers (verbatim from your file)  */
    double addition_diff(long long a,long long b){
        std::string s1=std::to_string(a),s2=std::to_string(b);
        double base=0.5*std::min(s1.size(),s2.size());
        int n=std::max(s1.size(),s2.size());
        s1.insert(s1.begin(),n-s1.size(),'0');
        s2.insert(s2.begin(),n-s2.size(),'0');
        int carry=0,cnt=0;
        for(int i=n-1;i>=0;--i)
            if((s1[i]-'0')+(s2[i]-'0')+carry>=10){cnt++;carry=1;}else carry=0;
        return base+0.75*cnt;
    }
    double subtraction_diff(long long a,long long b){
        if(a>b) std::swap(a,b);
        std::string small=std::to_string(a),big=std::to_string(b);
        double base=0.5*small.size();
        small.insert(small.begin(),big.size()-small.size(),'0');
        int borrow=0,cnt=0;
        for(int i=big.size()-1;i>=0;--i){
            int top=(big[i]-'0')-borrow;
            if(top<(small[i]-'0')){cnt++;borrow=1;}else borrow=0;
        }
        return base+0.75*cnt;
    }
    std::pair<long long,double> multiply_one_digit(int d,long long num){
        std::string s=std::to_string(num);
        double chunk=0, add=0; long long total=0;
        for(int i=s.size()-1;i>=0;--i){
            chunk+=0.5;
            long long part=1LL*d*(s[i]-'0')*
                           static_cast<long long>(std::pow(10,s.size()-1-i));
            if(total){add+=addition_diff(total,part); total+=part;} else total=part;
        }
        return {total,chunk+add};
    }
    std::vector<std::pair<int,int>> decompose(long long n){
        std::string s=std::to_string(n);
        std::vector<std::pair<int,int>> v;
        for(int i=0;i<s.size();++i) if(s[i]!='0')
            v.push_back({s[i]-'0',(int)s.size()-1-i});
        return v;
    }
    std::pair<long long,double> mul_diff(long long A,long long B){
        double subtotal=0,add=0; long long total=0;
        for(auto [core,z]:decompose(A)){
            auto [val,d]=multiply_one_digit(core,B);
            subtotal+=d; val*=static_cast<long long>(std::pow(10,z));
            if(total){add+=addition_diff(total,val); total+=val;} else total=val;
        }
        return {total, subtotal+add};
    }
    double div_diff(long long dividend,long long divisor){
        double diff=0; long long rem=0;
        for(char ch: std::to_string(dividend)){
            rem=rem*10+(ch-'0');
            if(rem<divisor) continue;
            diff+=subtraction_diff(rem,divisor);
            rem-=divisor;
        }
        return diff;
    }
    /*───────────────────────────────────────────────────────────────────*/
    /*  1.  fraction & utility structs                                   */
    struct Frac { long long n{0}, d{1}; };           // n / d,  d>0
    
    // forward declaration (definition below)
    std::pair<Frac,double> diff_on_fraction(char op,const Frac& a,const Frac& b);
    
    Frac reduce(Frac f){
        long long g = std::gcd(std::llabs(f.n), f.d);
        f.n /= g; f.d /= g;
        if (f.d < 0){ f.d = -f.d; f.n = -f.n; }
        return f;
    }
    double value(const Frac& f){ return static_cast<double>(f.n)/f.d; }
    
    long long llpow(long long b,long long e){
        long long res=1; while(e){ if(e&1) res*=b; b*=b; e>>=1; } return res;
    }
    bool is_perfect_kth(long long x,int k){
        if(x<0) x=-x;
        long long r=std::llround(std::pow(x,1.0/k));
        return llpow(r,k)==x||llpow(r+1,k)==x;
    }
    /* helper: difficulty of repeating mul base × … × base (k factors)  */
    double diff_repeat_mul(long long b,int k){
        if(k<=1) return 0;
        double d=0;
        for(int i=1;i<k;++i) d+=mul_diff(std::llabs(b),std::llabs(b)).second;
        return d;
    }
    /* numerator+denominator variant for fractional base                */
    double diff_repeat_mul_frac(long long p,long long q,int k){
        return diff_repeat_mul(p,k)+diff_repeat_mul(q,k);
    }
    /*───────────────────────────────────────────────────────────────────*/
    /*  2.  difficulty for b^(n/d)  (atomic, after exponent is final)    */
    double diff_power(const Frac& base, const Frac& exp){
        long long n = exp.n;
        long long d = exp.d;

        // trivial cases retain old behaviour
        if(n==0 || (n==1 && d==1)) return 0.5;  // a^0 or a^1

        bool frac_exp = (d!=1);
        bool negative = (n<0);
        long long absn = std::llabs(n);

        // helper lambdas ---------------------------------------------------
        auto power_cost = [&](long long num,long long den,long long k)->double{
            if(k<=1) return 0.0;
            if(den==1) return diff_repeat_mul(num, (int)k);
            return diff_repeat_mul_frac(num, den, (int)k);
        };

        auto root_cost = [&](long long num,long long den,int root)->double{
            long long rNum = std::llround(std::pow((double)num, 1.0 / root));
            long long rDen = std::llround(std::pow((double)den, 1.0 / root));
            return diff_repeat_mul_frac(rNum, rDen, root);
        };

        //------------------------------------------------------------------
        // Order A : power first, then root
        double costA = 0.0;
        // power step on original base
        costA += power_cost(std::llabs(base.n), base.d, absn);

        if(frac_exp){
            // intermediate base after power
            long long intNum, intDen;
            if(base.d==1){
                intNum = std::llabs(llpow(base.n,absn));
                intDen = 1;
            }else{
                intNum = llpow(base.n,absn);
                intDen = llpow(base.d,absn);
            }
            costA += root_cost(intNum, intDen, (int)d);
        }

        // Order B : root first, then power
        double costB = 0.0;
        if(frac_exp){
            // cost of taking root of original base
            costB += root_cost(std::llabs(base.n), base.d, (int)d);

            // base after root
            long long rNum = std::llround(std::pow((double)std::llabs(base.n), 1.0 / d));
            long long rDen = std::llround(std::pow((double)base.d, 1.0 / d));

            costB += power_cost(rNum, rDen, absn);
        }else{
            // no root step, same as power first
            costB = costA;
        }

        double diff = std::min(costA, costB);

        if(frac_exp) diff += 1;   // single non-integer exponent bump
        if(negative) diff += 1;   // negative exponent bump

        return diff;
    }
    /*───────────────────────────────────────────────────────────────────*/
    /*  3.  exponent-arithmetic difficulty (nested & chain)              */
    double diff_exponent_arith_mul(const Frac& x,const Frac& y){
        return diff_on_fraction('*', x, y).second;
    }

    double diff_exponent_arith_add(const std::vector<Frac>& list){
        if(list.empty()) return 0.0;
        Frac acc = list[0];
        double diff=0.0;
        for(size_t i=1;i<list.size();++i){
            char op = (list[i].n>=0)? '+' : '-';
            Frac term = list[i];
            if(op=='-') term.n = -term.n; // make positive for subtraction
            auto res = diff_on_fraction(op, acc, term);
            acc = res.first;
            diff += res.second;
        }
        return diff;
    }
    /*───────────────────────────────────────────────────────────────────*/
    /*  4.  Pools for RNG                                                */
    const std::vector<Frac> base_pool = {
        {2,1},{3,1},{4,1},{5,1},{6,1},{7,1},{8,1},{9,1},{10,1},
        {12,1},{16,1},{25,1},{27,1},{32,1},{36,1},{49,1},
        {1,2},{1,3},{1,4},{1,5},{2,3},{3,4},{3,5},{4,5}
    };
    const std::vector<long long> neg_int_base = {-2,-3,-4,-5,-6,-7,-8,-9,-10};
    
    const std::vector<Frac> exp_pool = {
        {1,1},{2,1},{3,1},{4,1},{5,1},
        {-1,1},{-2,1},{-3,1},{-4,1},{-5,1},
        {1,2},{2,3},{3,2},{4,3},{5,2},
        {-1,2},{-2,3},{-3,2},{-4,3},{-5,2}
    };
    /*───────────────────────────────────────────────────────────────────*/
    struct Question{
        std::string expr, ans;
        double difficulty;
    };
    
    /* rational-result filter for base & exponent --------------------- */
    bool rational_ok(const Frac& b,const Frac& e){
        long long n=e.n,d=e.d;
        if(b.d==1){
            long long absb = std::llabs(b.n);
            if(d!=1 && !is_perfect_kth(absb,(int)d)) return false;
            if(b.n<0 && d%2==0) return false;
        }else{
            long long p=b.n,q=b.d;
            if(!is_perfect_kth(p,(int)d) || !is_perfect_kth(q,(int)d)) return false;
        }
        return true;
    }
    /* format fraction to "a/b" (always reduced) --------------------- */
    std::string frac_to_string(const Frac& f){
        return std::to_string(f.n) + "/" + std::to_string(f.d);
    }
    /* render base: wrap negative integers in parentheses */
    std::string base_to_string(const Frac& b){
        if(b.d==1){
            if(b.n<0) return "("+std::to_string(b.n)+")";
            return std::to_string(b.n);
        }
        return "("+frac_to_string(b)+")";
    }
    /* helper pow on rationals (exact via integers) ------------------ */
    Frac pow_frac(const Frac& b,const Frac& e){    // assume rational_ok
        long long n=e.n,d=e.d;
        bool neg = (n<0); long long absn = std::llabs(n);
        // power
        long long p = llpow(b.n,absn);
        long long q = llpow(b.d,absn);
        // root if needed
        if(d!=1){
            long long rootP = std::llround(std::pow(static_cast<double>(p), 1.0 / d));
            long long rootQ = std::llround(std::pow(static_cast<double>(q), 1.0 / d));
            p = rootP;
            q = rootQ;
        }
        if(neg) std::swap(p,q);
        return reduce({p,q});
    }
    /*───────────────────────────────────────────────────────────────────*/
    /*  5.  generator for ONE question (may be SIMPLE / NESTED / CHAIN) */
    std::mt19937_64 rng(std::random_device{}());
    
    enum Form{SIMPLE,NESTED,CHAIN,DIFFBASE_SAMEEXP};
    std::uniform_int_distribution<int> distForm(0,3);
    
    Question generate_one(){
        std::uniform_int_distribution<int> bPos(0, base_pool.size()-1);
        std::uniform_int_distribution<int> bNeg(0, neg_int_base.size()-1);
        std::uniform_int_distribution<int> ePos(0, exp_pool.size()-1);
        std::uniform_real_distribution<double> coin(0,1);
        while(true){
            /* pick form */
            Form form = static_cast<Form>(distForm(rng));
    
            /* pick base */
            Frac base;
            if(coin(rng)<0.3){ base={neg_int_base[bNeg(rng)],1}; }
            else              base=base_pool[bPos(rng)];
    
            /* prepare combined exponent E and difficulty on exponent-arith */
            Frac E{0,1};  double diff_exp_arith=0;
            std::string expr;
            bool extraMinus=false;   // for -b^k without parens
            Frac val; // will hold final value for magnitude checks
    
            if(form==SIMPLE){
                Frac e = exp_pool[ePos(rng)];
                E = e;
                // decide parentheses rule
                bool needParens=true;
                if(base.n<0 && base.d==1){
                    if(e.d==1){ // integer exponent
                        double prob = (std::llabs(e.n)%2==0? 0.40 : 0.20);
                        if(rng() / double(rng.max()) < prob) needParens=false;
                    }else if(e.d%2==0){ // even denominator fraction
                        needParens=false;
                    }
                }

                std::string baseStr = needParens ? base_to_string(base)
                                                  : std::to_string(base.n);
                if(!needParens && base.n<0 && base.d==1) extraMinus=true;

                expr = baseStr + "^" + (e.d==1? std::to_string(e.n)
                                                 : frac_to_string(e));
            }
            else if(form==NESTED){
                Frac x = exp_pool[ePos(rng)];
                Frac y = exp_pool[ePos(rng)];
                /* combine: x·y */
                E = reduce({ x.n*y.n , x.d*y.d });
                diff_exp_arith = diff_exponent_arith_mul(x,y);
                expr = "((" + base_to_string(base)
                     + ")^" + (x.d==1? std::to_string(x.n)
                                      : frac_to_string(x))
                     + ")^"  + (y.d==1? std::to_string(y.n)
                                      : frac_to_string(y));
            }
            else if(form==CHAIN){   /* CHAIN: 3 terms  a^x * a^y / a^z */
                Frac x = exp_pool[ePos(rng)];
                Frac y = exp_pool[ePos(rng)];
                Frac z = exp_pool[ePos(rng)];

                /* combined exponent  E = x + y - z  */
                long long lcd = std::lcm(x.d, std::lcm(y.d, z.d));
                long long num =  x.n * (lcd / x.d)
                              + y.n * (lcd / y.d)
                              - z.n * (lcd / z.d);
                E = reduce({num, lcd});

                diff_exp_arith = diff_exponent_arith_add({x, y, {-z.n, z.d}});

                auto baseStr = base_to_string(base);
                auto expStr = [](const Frac& f){
                    return (f.d==1? std::to_string(f.n):frac_to_string(f));
                };

                expr = baseStr + "^(" + expStr(x) + ") * "
                     + baseStr + "^(" + expStr(y) + ") / "
                     + baseStr + "^(" + expStr(z) + ")";
            }
            else{   /* DIFFBASE_SAMEEXP :  a^m *or/ b^m  */
                // pick integer exponent m
                Frac mExp;
                while(true){
                    Frac cand = exp_pool[ePos(rng)];
                    if(cand.d==1){ mExp=cand; break; }
                }

                // pick bases a and b
                Frac aBase = base_pool[bPos(rng)];
                if(coin(rng)<0.3) aBase={neg_int_base[bNeg(rng)],1};
                Frac bBase = base_pool[bPos(rng)];
                if(coin(rng)<0.3) bBase={neg_int_base[bNeg(rng)],1};

                // decide primary operator (mul/div)
                bool isMul = (coin(rng)<0.5);

                // decide trap
                double trapP = 0.1 + (coin(rng)*0.1); // 0.10 to 0.20
                bool isTrap = (coin(rng) < trapP);

                char opActual;
                if(!isTrap){ opActual = isMul ? '*' : '/'; }
                else{ opActual = (coin(rng)<0.5? '+' : '-'); }

                // build term strings with base parentheses handling
                auto baseStrA = base_to_string(aBase);
                auto baseStrB = base_to_string(bBase);
                std::string mStr = std::to_string(mExp.n);

                std::string termA = baseStrA + "^" + mStr;
                std::string termB = baseStrB + "^" + mStr;
                expr = termA + " " + opActual + " " + termB;

                // compute difficulty and value
                double diff_local = 0.0;

                if(!isTrap){
                    // combine bases first
                    auto comb = diff_on_fraction(isMul?'*':'/', aBase, bBase);
                    diff_local += comb.second;
                    Frac combinedBase = comb.first;
                    if(!rational_ok(combinedBase,mExp)) continue;
                    val = pow_frac(combinedBase, mExp);
                    diff_local += diff_power(combinedBase, mExp);
                }else{
                    // trap: evaluate separately then add/sub
                    if(!rational_ok(aBase,mExp) || !rational_ok(bBase,mExp)) continue;
                    auto valA = pow_frac(aBase, mExp);
                    auto valB = pow_frac(bBase, mExp);
                    diff_local += diff_power(aBase, mExp);
                    diff_local += diff_power(bBase, mExp);
                    auto comb = diff_on_fraction(opActual, valA, valB);
                    diff_local += comb.second;
                    val = comb.first;

                    // ensure each term magnitude band
                    double absA=std::fabs(value(valA));
                    double absB=std::fabs(value(valB));
                    if(absA<1.0/256.0 || absA>256.0 || absB<1.0/256.0 || absB>256.0) continue;
                }

                diff_exp_arith = diff_local;   // use variable for later sum
                E = {-1,1}; // dummy to skip further combine; we set total_diff later

                // magnitude filter shared later will use val
                base = {0,1}; // set base dummy so rational_ok not reused later
            }
    
            double total_diff;
            if(E.d!=1 || E.n!= -1){ // normal paths where E meaningful
                /* choose base for calculation: drop sign if minus is outside */
                Frac calcBase = base;
                if(extraMinus && calcBase.n<0) calcBase.n = -calcBase.n;

                /* rational-result + magnitude filter */
                if(!rational_ok(calcBase,E)) continue;
                Frac valTmp = pow_frac(calcBase,E);
                if(extraMinus) valTmp.n *= -1;         // apply outside minus
                if(std::llabs(valTmp.n) > 256 || valTmp.d > 256) continue;  // enforce small components first
                double valdbl = std::fabs(value(valTmp));
                if(valdbl<1.0/256.0 || valdbl>256.0) continue;

                val = valTmp;
                double diff_atomic = diff_power(calcBase,E);
                total_diff = diff_exp_arith + diff_atomic;
            }else{
                // value & diff already computed in diff_exp_arith branch
                if(std::llabs(val.n) > 256 || val.d > 256) continue;
                double valdbl = std::fabs(value(val));
                if(valdbl<1.0/256.0 || valdbl>256.0) continue;
                total_diff = diff_exp_arith;
            }
    
            return {expr, frac_to_string(val), total_diff};
        }
    }
    /*───────────────────────────────────────────────────────────────────*/
    int main(){
        constexpr int TARGET = 250'000;
        int produced = 0;
        std::unordered_set<std::string> seen;   // O(1) duplicate filter

        while(produced < TARGET){
            try{
                Question q = generate_one();
                if(seen.count(q.expr)) continue;    // skip duplicates
                seen.insert(q.expr);
                std::cout << "{\"expression\":\""<<q.expr
                          << "\",\"answer\":\""<<q.ans
                          << "\",\"difficulty\":"<<std::fixed<<std::setprecision(2)<<q.difficulty
                          <<"}\n";
                ++produced;
            }catch(const std::length_error &){
                continue; // skip pathological case and keep generating
            }
        }
        return 0;
    }
    
    /*───────────────────────────────────────────────────────────────*/
    /*  NEW helper: difficulty on fraction arithmetic                */
    /*───────────────────────────────────────────────────────────────*/
    std::pair<Frac,double> diff_on_fraction(char op,const Frac& a,const Frac& b){
        // Ensure denominators positive
        auto make_pos = [](const Frac& f){ Frac r=f; if(r.d<0){ r.d=-r.d; r.n=-r.n;} return r; };
        Frac A = make_pos(a); Frac B = make_pos(b);

        if(op=='+' || op=='-'){
            long long lcd = std::lcm(A.d, B.d);
            double lcdCost = (lcd==A.d && lcd==B.d)? 0.0 : addition_diff(A.d, B.d);

            long long scaledA = A.n * (lcd / A.d);
            long long scaledB = B.n * (lcd / B.d);

            long long N;
            double coreCost;
            if(op=='+'){
                N = scaledA + scaledB;
                coreCost = addition_diff(scaledA, scaledB);
            }else{ // '-'
                N = scaledA - scaledB;
                coreCost = subtraction_diff(scaledA, scaledB);
            }

            long long D = lcd;
            long long g = std::gcd(std::llabs(N), D);
            double simpCost = 0.0;
            if(g>1){
                simpCost = div_diff(std::llabs(N), g) + div_diff(D, g);
                N/=g; D/=g;
            }
            return { Frac{N,D}, lcdCost + coreCost + simpCost };
        }

        // Multiplication or division
        Frac B_eff = B;
        if(op=='/') { std::swap(B_eff.n, B_eff.d); } // invert b

        // multiply numerators and denominators separately
        double numCost = mul_diff(std::llabs(A.n), std::llabs(B_eff.n)).second;
        double denCost = mul_diff(A.d, B_eff.d).second;

        long long N = A.n * B_eff.n;
        long long D = A.d * B_eff.d;

        long long g = std::gcd(std::llabs(N), D);
        double simpCost = 0.0;
        if(g>1){
            simpCost = div_diff(std::llabs(N), g) + div_diff(D, g);
            N/=g; D/=g;
        }
        return { Frac{N,D}, numCost + denCost + simpCost };
    }
    