<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateTimeSpend extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('topic_leaderboards', function (Blueprint $table) {
            $table->dropColumn('timespend');
        });
		
		
		     Schema::table('topic_leaderboards', function (Blueprint $table) {
            $table->integer('timespend')->default(0);
        });
		
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('topic_leaderboards', function (Blueprint $table) {
            //
        });
    }
}
