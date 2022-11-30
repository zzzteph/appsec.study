<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFlightsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
       Schema::table('topics', function (Blueprint $table) {
			$table->enum('type', ['course', 'tournament','evaluation'])->default('course');
		});
		
		
		
		
		
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('Topics', function (Blueprint $table) {
            //
        });
    }
}
