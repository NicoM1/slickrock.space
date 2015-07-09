package;

#if macro
import sys.io.File;
#end

class Version {
    macro public static function get() {
        var strVer = File.getContent('bin/ver.txt');
        var intVer = Std.parseInt(strVer);
        intVer++;
        File.saveContent('bin/ver.txt', Std.string(intVer));
        return macro $v{intVer};
    }
}
